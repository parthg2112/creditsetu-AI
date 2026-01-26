"""
CreditSetu AI Backend - Optimized Version
==========================================
Key Optimizations:
1. Response streaming via SSE (Server-Sent Events)
2. Background TTS/PDF generation (non-blocking)
3. Rate limiting with slowapi
4. Environment validation with pydantic-settings
5. Proper CORS configuration
6. Consolidated AI calls
7. Consistent error handling
"""

import os
import uuid
import json
import base64
import re
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from fpdf import FPDF
from gtts import gTTS
import google.generativeai as genai
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.utils.supabase_client import save_message, get_chat_history, get_latest_session, delete_chat_history
from app.rag import query_rbi_docs, retrieve_context

# --- 1. CONFIGURATION & VALIDATION ---
load_dotenv()


class Settings(BaseSettings):
    """Validated environment configuration"""
    gemini_api_key: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    google_api_key: Optional[str] = Field(default=None, alias="GOOGLE_API_KEY")
    redis_url: Optional[str] = Field(default=None, alias="REDIS_URL")
    allowed_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000", alias="ALLOWED_ORIGINS")
    
    # Additional env vars from your project
    supabase_url: Optional[str] = Field(default=None, alias="SUPABASE_URL")
    supabase_service_role_key: Optional[str] = Field(default=None, alias="SUPABASE_SERVICE_ROLE_KEY")
    llama_cloud_api_key: Optional[str] = Field(default=None, alias="LLAMA_CLOUD_API_KEY")
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    
    @property
    def api_key(self) -> str:
        key = self.gemini_api_key or self.google_api_key
        if not key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY must be set")
        return key
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra env vars not defined in the model


settings = Settings()

# Rate Limiter
# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

def get_user_email(request: Request) -> str:
    return request.headers.get("X-User-Email", "anonymous")

def whitelist_key(request: Request) -> Optional[str]:
    email = get_user_email(request)
    if email in ["mail@parthg.me", "heetp420@gmail.com", "soumyadoshi28@gmail.com"]:
        return email
    return None

def standard_key(request: Request) -> Optional[str]:
    email = get_user_email(request)
    if email not in ["mail@parthg.me", "heetp420@gmail.com", "soumyadoshi28@gmail.com"]:
        return email
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    print("🚀 CreditSetu AI Backend starting...")
    genai.configure(api_key=settings.api_key)
    print("✅ Gemini AI configured")
    yield
    # Shutdown
    print("👋 CreditSetu AI Backend shutting down...")


app = FastAPI(
    title="CreditSetu AI Consultant",
    description="Optimized conversational loan advisor with streaming support",
    lifespan=lifespan
)

# Add rate limit exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: Restrict to known origins
allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers to fix CORS issues with custom headers like X-User-Email
    allow_credentials=True,
)

# AI Model
model = genai.GenerativeModel("gemini-2.0-flash")

# --- 2. DATA MODELS ---

class LoanSession(BaseModel):
    session_id: str
    chat_history: List[Dict[str, str]] = []
    
    # Loan Parameters
    annual_income: Optional[float] = None
    monthly_debt: Optional[float] = None
    loan_amount: Optional[float] = None
    
    # Credit Score Parameters
    payment_history_rating: Optional[int] = Field(None, description="0-60 score")
    credit_utilization: Optional[float] = Field(None, description="0.0-1.0")
    credit_history_years: Optional[int] = None
    open_credit_lines: Optional[int] = None
    recent_inquiries: Optional[int] = None
    bankruptcy_history: Optional[int] = None
    defaults_history: Optional[int] = None


class ChatResponse(BaseModel):
    response_text: str
    user_transcription: Optional[str] = None
    audio_url: Optional[str] = None  # Changed from base64 to URL
    chart_data: Optional[Dict[str, Any]] = None
    report_url: Optional[str] = None
    is_rbi_verified: bool = False


class StreamChunk(BaseModel):
    """Model for SSE streaming chunks"""
    type: str  # "text", "audio_ready", "chart", "report", "done", "error"
    content: Any


# Session Storage (with abstraction for future Redis migration)
class SessionStore:
    """Abstract session storage - can be swapped to Redis later"""
    
    def __init__(self):
        self._store: Dict[str, LoanSession] = {}
    
    def get(self, session_id: str) -> Optional[LoanSession]:
        return self._store.get(session_id)
    
    def set(self, session_id: str, session: LoanSession) -> None:
        self._store[session_id] = session
    
    def create(self) -> LoanSession:
        sid = str(uuid.uuid4())
        session = LoanSession(session_id=sid)
        self._store[sid] = session
        return session
    
    def update_from_dict(self, session_id: str, updates: Dict[str, Any]) -> LoanSession:
        session = self.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        session_dict = session.model_dump()
        session_dict.update(updates)
        updated = LoanSession(**session_dict)
        self.set(session_id, updated)
        return updated


    def clear(self, session_id: str) -> None:
        """Clear session history and data"""
        if session_id in self._store:
            # Re-initialize clean session
            self._store[session_id] = LoanSession(session_id=session_id)

sessions = SessionStore()

# --- 3. HELPER FUNCTIONS ---

def get_missing_fields(session: LoanSession) -> List[str]:
    """Check which mandatory parameters are still missing"""
    missing = []
    if session.annual_income is None: missing.append("Annual Income")
    if session.monthly_debt is None: missing.append("Monthly Debt Payments")
    if session.loan_amount is None: missing.append("Requested Loan Amount")
    if session.payment_history_rating is None: missing.append("Payment Reliability (0-60)")
    if session.credit_utilization is None: missing.append("Credit Card Utilization %")
    if session.credit_history_years is None: missing.append("Credit History Length (Years)")
    if session.open_credit_lines is None: missing.append("Number of Active Credit Lines")
    if session.recent_inquiries is None: missing.append("Recent Inquiries (Last 6 months)")
    if session.bankruptcy_history is None: missing.append("Bankruptcy History (Yes/No)")
    if session.defaults_history is None: missing.append("Loan Default History (Yes/No)")
    return missing


def clean_json_string(json_str: str) -> str:
    """Remove markdown code blocks from JSON string"""
    cleaned = re.sub(r'```json\s*', '', json_str)
    cleaned = re.sub(r'```\s*', '', cleaned)
    return cleaned.strip()


# --- 4. CREDIT SCORING ENGINE ---

def calculate_score_and_decision(data: LoanSession) -> Dict[str, Any]:
    """
    Calculate credit score and generate audit data.
    Returns a comprehensive result dict.
    """
    score = 300  # Baseline
    red_flags = []
    strengths = []
    plan = []
    
    # Safe defaults
    pay_hist = data.payment_history_rating or 0
    util = data.credit_utilization or 0.5
    hist_len = data.credit_history_years or 0
    lines = data.open_credit_lines or 0
    inq = data.recent_inquiries or 0
    monthly_income = (data.annual_income or 1) / 12
    dti = (data.monthly_debt or 0) / monthly_income if monthly_income > 0 else 0.0
    
    # 1. Payment History (35%) - Max 210
    score_payment = (pay_hist / 60) * 210
    score += score_payment
    if pay_hist < 40:
        red_flags.append("Payment history is below average. Avoid missing any future payments.")
    else:
        strengths.append("Strong payment reliability record.")
    
    # 2. Utilization (30%) - Max 180
    score_util = 0
    if util <= 1.0:
        score_util = 180 * (1.0 - util)
        score += score_util
    if util > 0.4:
        red_flags.append(f"Credit utilization is high ({int(util*100)}%). Try to keep it under 30%.")
    else:
        strengths.append("Healthy credit utilization ratio.")
    
    # 3. History Length (15%) - Max 90
    score_age = min(hist_len, 10) * 9
    score += score_age
    if hist_len < 3:
        plan.append("Keep your oldest accounts open to build credit history length.")
    
    # 4. Credit Mix (10%) - Max 60
    if lines >= 5:
        score_mix = 60
    elif lines >= 2:
        score_mix = 40
    else:
        score_mix = 20
    score += score_mix
    
    # 5. New Credit (10%) - Max 60
    if inq == 0:
        score_new = 60
    elif inq <= 2:
        score_new = 40
    else:
        score_new = 20
    score += score_new
    if inq > 3:
        red_flags.append(f"Too many recent inquiries ({inq}). Pause applying for new credit.")
    
    # Penalties
    if data.bankruptcy_history == 1:
        score -= 150
        red_flags.append("Bankruptcy history significantly impacts your score.")
    if data.defaults_history == 1:
        score -= 100
        red_flags.append("Past loan defaults are a major negative factor.")
    
    if dti > 0.4:
        red_flags.append(f"High Debt-to-Income Ratio ({int(dti*100)}%). Banks prefer <40%.")
    elif dti < 0.3:
        strengths.append("Excellent Debt-to-Income ratio.")
    
    final_score = int(max(300, min(900, score)))
    
    # Decision
    decision = "APPROVED"
    reason = "Your profile meets our lending criteria."
    
    if final_score < 650:
        decision = "REJECTED"
        reason = f"Credit Score {final_score} is below the 650 threshold."
        plan.append("Wait 6 months before applying to improve score.")
    elif dti > 0.50:
        decision = "REJECTED"
        reason = f"DTI {int(dti*100)}% is too high (Max 50%)."
        plan.append("Clear robust debts to reduce monthly obligations.")
    
    plan.append("Ensure your ITR reflects this income to pass bank verification.")
    
    # Radar Data
    radar_data = [
        {"letter": "Payment", "frequency": int((score_payment/210)*100)},
        {"letter": "Usage", "frequency": int((score_util/180)*100) if util <= 1.0 else 0},
        {"letter": "Age", "frequency": int((score_age/90)*100)},
        {"letter": "Mix", "frequency": int((score_mix/60)*100)},
        {"letter": "New Credit", "frequency": int((score_new/60)*100)},
        {"letter": "DTI", "frequency": max(0, 100 - int(dti*100))}
    ]
    
    return {
        "score": final_score,
        "decision": decision,
        "reason": reason,
        "plan": plan,
        "red_flags": red_flags,
        "strengths": strengths,
        "radar_data": radar_data,
        "health_score": int((final_score - 300) / 600 * 100)
    }


def generate_score_gauge(score: int, filename: str):
    """Generate vibrant modern donut gauge chart"""
    # Normalize score 300-900 -> 0-1
    min_score = 300
    max_score = 900
    norm_score = (score - min_score) / (max_score - min_score)
    
    # Colors: Red -> Yellow -> Green
    colors = ['#EF4444', '#F59E0B', '#10B981']
    color = colors[0] if score < 650 else colors[1] if score < 750 else colors[2]
    
    fig, ax = plt.subplots(figsize=(6, 3), subplot_kw={'projection': 'polar'})
    ax.set_theta_zero_location('N')
    ax.set_theta_direction(-1)
    
    # Background Track (Thin Arc)
    ax.barh(0, np.pi, left=-np.pi/2, height=0.3, color='#E5E7EB', edgecolor='none')
    
    # Value Arc
    ax.barh(0, norm_score * np.pi, left=-np.pi/2, height=0.3, color=color, alpha=1.0)
    
    # Hide axis
    ax.set_axis_off()
    
    # Removed text to prevent overlap as per user request
    
    plt.savefig(filename, bbox_inches='tight', transparent=True, dpi=120)
    plt.close()


def generate_radar_chart(audit_data: Dict[str, Any], filename: str):
    """Generate clean radar chart"""
    categories = [d['letter'] for d in audit_data['radar_data']]
    values = [d['frequency'] for d in audit_data['radar_data']]
    
    # Close the loop
    values += values[:1]
    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    angles += angles[:1]
    
    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    
    # Background grid style
    ax.set_facecolor('#F9FAFB')
    ax.grid(color='#E5E7EB', linestyle='--', linewidth=1)
    
    # Draw polygon
    ax.plot(angles, values, color='#6366F1', linewidth=2, linestyle='solid')
    ax.fill(angles, values, color='#6366F1', alpha=0.2)
    
    # Labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=11, fontweight='bold', color='#374151')
    
    # Y-labels (Hide/Minimal)
    ax.set_yticklabels([])
    ax.spines['polar'].set_visible(False)
    plt.ylim(0, 100)
    
    plt.savefig(filename, bbox_inches='tight', transparent=True, dpi=120)
    plt.close()


# --- 5. BACKGROUND TASKS ---

def generate_pdf_sync(session_id: str, audit_data: Dict[str, Any]) -> str:
    """Synchronous PDF generation with pro dense layout"""
    pdf = FPDF()
    pdf.set_auto_page_break(False) # Manual control for density
    pdf.add_page()
    
    # --- HEADER ---
    pdf.set_font("Helvetica", 'B', 18)
    pdf.set_text_color(40, 50, 70)
    pdf.cell(0, 8, txt="CREDITSETU AI AUDIT", ln=1, align='L')
    
    pdf.set_font("Helvetica", '', 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, txt=f"Session: {session_id[:8]} | Date: {datetime.now().strftime('%Y-%m-%d')}", ln=1, align='L')
    
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, 25, 200, 25)
    
    # --- ROW 1: VISUALS (Gauge Left, Radar Right) ---
    y_visuals = 30
    
    # Generate Charts
    gauge_path = f"backend/data/gauge_{session_id}.png"
    generate_score_gauge(audit_data["score"], gauge_path)
    
    radar_path = f"backend/data/radar_{session_id}.png"
    generate_radar_chart(audit_data, radar_path)
    
    # Place Images
    # Gauge on Left
    pdf.image(gauge_path, x=10, y=y_visuals, w=80) 
    
    # Radar on Right
    pdf.image(radar_path, x=110, y=y_visuals, w=80)
    
    # Cleanup images
    os.remove(gauge_path)
    os.remove(radar_path)
    
    # Place Labels/Titles for charts
    pdf.set_y(y_visuals)
    pdf.set_font("Helvetica", 'B', 10)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(90, 5, "CREDIT SCORE", align='C')
    pdf.set_x(110)
    pdf.cell(80, 5, "FACTOR ANALYSIS", align='C')
    
    # --- ROW 2: DECISION Context (Centered below Gauge) ---
    # We put decision text below the Gauge, but keep Radar visible on right
    y_decision = y_visuals + 45 # Gauge is approx 40-50 high
    
    pdf.set_xy(10, y_decision)
    pdf.set_font("Helvetica", 'B', 10)
    pdf.cell(90, 5, "DECISION STATUS:", ln=1, align='C')
    
    status_color = (20, 150, 80) if audit_data['decision'] == 'APPROVED' else (200, 50, 50)
    pdf.set_text_color(*status_color)
    pdf.set_font("Helvetica", 'B', 16)
    pdf.cell(90, 7, audit_data['decision'], ln=1, align='C')
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", '', 9)
    pdf.set_x(15)
    # Wrap text for reason
    reason_clean = audit_data['reason'].encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(80, 4, txt=reason_clean, align='C')
    
    # Move past the visuals row
    pdf.set_y(y_decision + 35) # Ensure we clear the charts
    
    # --- ROW 3: INSIGHTS (Strengths Left, Risks Right) ---
    y_insights = pdf.get_y()
    left_col_x = 10
    right_col_x = 105
    col_width = 90
    
    # Function for boxes
    def print_colored_box(x, y, title, items, bg_color, title_color):
        pdf.set_xy(x, y)
        pdf.set_fill_color(*bg_color)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(*title_color)
        pdf.cell(col_width, 7, f"  {title}", ln=1, fill=True)
        
        pdf.set_font("Helvetica", '', 9)
        pdf.set_text_color(0, 0, 0)
        pdf.set_x(x)
        current_y = pdf.get_y() + 2
        for item in items:
            pdf.set_xy(x, current_y)
            text = f"- {item}".encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(col_width, 4, text)
            current_y = pdf.get_y() + 1
        return current_y

    # Strengths (Left, Green)
    y_end_left = print_colored_box(
        left_col_x, y_insights, 
        "STRENGTHS", 
        audit_data.get('strengths', []), 
        (220, 252, 231), (21, 128, 61)
    )
    
    # Risks (Right, Red)
    y_end_right = print_colored_box(
        right_col_x, y_insights, 
        "RISK FACTORS", 
        audit_data.get('red_flags', []), 
        (254, 226, 226), (185, 28, 28)
    )
    
    # Sync Y to the taller box
    new_y = max(y_end_left, y_end_right) + 8
    
    # --- ROW 4: ACTION PLAN (Full Width) ---
    pdf.set_xy(10, new_y)
    pdf.set_fill_color(240, 248, 255) # AliceBlue
    pdf.set_font("Helvetica", 'B', 10)
    pdf.set_text_color(30, 64, 175) # Blue-800
    pdf.cell(190, 7, "  RECOMMENDED ACTION PLAN", ln=1, fill=True)
    
    pdf.set_font("Helvetica", '', 9)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)
    
    for step in audit_data['plan']:
        text = f"[ ] {step}".encode('latin-1', 'replace').decode('latin-1')
        pdf.set_x(10)
        pdf.multi_cell(190, 5, text)
        pdf.ln(1)
        
    # --- FOOTER ---
    pdf.set_y(-10)
    pdf.set_font("Helvetica", 'I', 7)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 5, "Generated by LendReady AI. This report is an estimate and not an official bank document.", align='C')
    
    filename = f"report_{session_id}.pdf"
    path = f"backend/data/{filename}"
    os.makedirs("backend/data", exist_ok=True)
    pdf.output(path)
    return filename


def generate_tts_sync(text: str, session_id: str) -> str:
    """Synchronous TTS generation (runs in background)"""
    try:
        clean_text = text.replace("**", "").replace("*", "")[:500]
        tts = gTTS(clean_text, lang='en')
        filename = f"audio_{session_id}.mp3"
        path = f"backend/data/{filename}"
        os.makedirs("backend/data", exist_ok=True)
        tts.save(path)
        return filename
    except Exception as e:
        print(f"TTS Error: {e}")
        return ""


# --- 6. SYSTEM PROMPT ---

BASE_SYSTEM_INSTRUCTION = """
You are Creditsetu, an expert Indian AI Loan Consultant.

**YOUR MODES:**

1. **ADVISORY (Default for "How to", "Help me", "Education Loan"):**
   - Provide advice immediately without forcing full data collection.
   - Keep it conversational and helpful.

2. **APPROVAL AGENT (Triggered by "Check Score", "Am I eligible?"):**
   - Collect the 10 mandatory variables one by one.
   - Extract numbers from user responses into `extracted_updates`.

3. **REGULATORY & LITERACY EXPERT (Triggered when RBI/Regulations or Literacy context is provided):**
   - Answer strictly based on the provided context.
   - Do NOT ask for loan application details (income, debt, etc.) unless the user explicitly connects the regulation to their personal application.
   - Prioritize the user's question over the data collection flow.

**CRITICAL RULES:**
1. **STRICT EXTRACTION:** ONLY extract the variable corresponding to the `JSON KEY TO USE`. Do NOT extract values for other fields unless explicitly stated by the user.
2. **VALIDATION & CONVERSION:**
   - For `annual_income`, `monthly_debt`, `loan_amount`: Extract the numeric value in Rupees.
   - **INTELLIGENT NORMALIZATION:**
     - Detect and convert ALL variations of Indian numbering (Lakh, Lac, L, Crore, Cr, k, etc.) into plain integers.
     - Example: "1.5L" -> 150000, "10 Lacs" -> 1000000.
     - Remove all currency symbols (₹, INR, Rs) and commas.
   - **HANDLE RANGES:** If user gives a range (e.g., "10-12 Lakhs", "100-500 cr"), calculate and use the **AVERAGE**.
   - If input is ambiguous, ask for clarification.
3. **NO HALLUCINATIONS:** Never assume a value (especially bankruptcy/defaults) from an unrelated answer.
4. **IMMEDIATE FOLLOW-UP (FLOW CONTROL):**
   - If the user provides the answer for `CURRENT QUESTION`:
     1. Extract the value into `extracted_updates`.
     2. Acknowledge briefly (e.g., "Got it.", "Noted.").
     3. **IMMEDIATELY ASK THE NEXT FIELD** from the `FIELDS NEEDED` list.
     - *Example:* If user answers "Annual Income" and the list has `['Annual Income', 'Monthly Debt', ...]`, you MUST ask about "Monthly Debt" in the same response.
   - Do NOT stop at acknowledgment. Keep the audit moving.

**MANDATORY VARIABLES:**
1. `loan_amount` - Loan Amount (Rupees)
2. `annual_income` - Annual Income (Rupees)
3. `monthly_debt` - Monthly Debt (Rupees)
4. `payment_history_rating` - Payment Reliability (0-60)
5. `credit_utilization` - Credit Utilization (0.0-1.0)
6. `credit_history_years` - Credit History (Years)
7. `open_credit_lines` - Active Credit Lines
8. `recent_inquiries` - Recent Inquiries (Last 6 months)
9. `bankruptcy_history` - Bankruptcy (0=No, 1=Yes)
10. `defaults_history` - Defaults (0=No, 1=Yes)

**OUTPUT FORMAT (Always JSON, no markdown):**
{
  "response_text": "Your brief acknowledgment + NEXT QUESTION...",
  "user_transcription": "Verbatim transcription of the user's audio input (if audio provided)",
  "extracted_updates": {"field_name": value},
  "is_ready": false
}
"""

# Field name mapping
FIELD_TO_KEY = {
    "Annual Income": "annual_income",
    "Monthly Debt Payments": "monthly_debt",
    "Requested Loan Amount": "loan_amount",
    "Payment Reliability (0-60)": "payment_history_rating",
    "Credit Card Utilization %": "credit_utilization",
    "Credit History Length (Years)": "credit_history_years",
    "Number of Active Credit Lines": "open_credit_lines",
    "Recent Inquiries (Last 6 months)": "recent_inquiries",
    "Bankruptcy History (Yes/No)": "bankruptcy_history",
    "Loan Default History (Yes/No)": "defaults_history"
}


# --- 7. API ENDPOINTS ---

@app.get("/")
def health_check():
    """Health check endpoint"""
    return {"status": "active", "version": "2.0", "features": ["streaming", "rate-limiting"]}


@app.post("/chat/clear/{session_id}")
async def clear_chat(session_id: str):
    """Clear session history"""
    # Clear Supabase Persistence
    delete_chat_history(session_id)
    
    # Clear Memory
    if session_id in sessions._store:
        sessions.clear(session_id)
        
    return {"status": "success", "message": "Session cleared"}


@app.post("/chat/init")
@limiter.limit("10000/day", key_func=whitelist_key)
@limiter.limit("10/day", key_func=standard_key)
def init_chat(request: Request, language: str = "en"):
    """Initialize a new chat session"""
    user_email = get_user_email(request)
    session_id = None
    chat_history = []
    
    # Try to resume last session
    if user_email != "anonymous":
        last_sid = get_latest_session(user_email)
        if last_sid:
            session_id = last_sid
            chat_history = get_chat_history(session_id)
            # Rehydrate session object
            session = sessions.get(session_id)
            if not session:
                session = LoanSession(session_id=session_id)
                sessions.set(session_id, session)
    
    if not session_id:
        session = sessions.create()
        session_id = session.session_id
    
    suggested_questions = [
        "Check my loan eligibility 🏦",
        "How can I improve my credit score? 📈",
        "What documents do I need? 📄",
        "Analyze ₹5 Lakhs loan readiness ✅"
    ]
    
    # Localized Greetings
    greetings = {
        "en": """**Welcome to CreditSetu AI** 👋

I'm your AI loan consultant. Choose an option:

**1.** Check Loan Eligibility 🏦
**2.** Improve Credit Score 📈
**3.** Document Checklist 📄
**4.** Rules and Regulations 📜
""",
        "hi": """**क्रेडिटसेतु AI में आपका स्वागत है** 👋

मैं आपका AI लोन सलाहकार हूँ। एक विकल्प चुनें:

**1.** लोन पात्रता की जाँच करें 🏦
**2.** क्रेडिट स्कोर सुधारें 📈
**3.** दस्तावेज़ चेकलिस्ट 📄
**4.** नियम और विनियम 📜
""",
        "hinglish": """**CreditSetu AI mein aapka swagat hai** 👋

Main aapka AI loan consultant hoon. Ek option chunein:

**1.** Loan Eligibility check karein 🏦
**2.** Credit Score improve karein 📈
**3.** Document Checklist 📄
**4.** Rules aur Regulations 📜
""",
        "te": """**క్రెడిట్‌సేతు AI కి స్వాగతం** 👋

నేను మీ AI లోన్ సలహాదారుడిని. ఒక ఎంపికను ఎంచుకోండి:

**1.** లోన్ అర్హతను తనిఖీ చేయండి 🏦
**2.** క్రెడిట్ స్కోర్ మెరుగుపరచండి 📈
**3.** డాక్యుమెంట్ చెక్‌లిస్ట్ 📄
**4.** నియమాలు మరియు నిబంధనలు 📜
""",
        "mr": """**क्रेडिटसेतु AI मध्ये आपले स्वागत आहे** 👋

मी तुमचा AI कर्ज सल्लागार आहे. एक पर्याय निवडा:

**1.** कर्ज पात्रता तपासा 🏦
**2.** क्रेडिट स्कोर सुधारा 📈
**3.** कागदपत्र चेकलिस्ट 📄
**4.** नियम आणि कायदे 📜
""",
        "ta": """**கிரெடிட்சேது AI க்கு வரவேற்கிறோம்** 👋

நான் உங்கள் AI கடன் ஆலோசகன். ஒரு விருப்பத்தைத் தேர்வு செய்யவும்:

**1.** கடன் தகுதியைச் சரிபார்க்கவும் 🏦
**2.** கிரெடிட் ஸ்கோரை மேம்படுத்தவும் 📈
**3.** ஆவண சரிபார்ப்புப் பட்டியல் 📄
**4.** விதிகள் மற்றும் ஒழுங்குமுறைகள் 📜
""",
        "kn": """**ಕ್ರೆಡಿಟ್‍ಸೇತು AI ಗೆ ಸ್ವಾಗತ** 👋

ನಾನು ನಿಮ್ಮ AI ಸಾಲ ಸಲಹೆಗಾರ. ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ:

**1.** ಸಾಲ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ 🏦
**2.** ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಸುಧಾರಿಸಿ 📈
**3.** ದಾಖಲೆ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ 📄
**4.** ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳು 📜
""",
        "bn": """**ক্রেডিটসেতু AI তে স্বাগতম** 👋

আমি আপনার AI লোন উপদেষ্টা। একটি বিকল্প বেছে নিন:

**1.** লোন যোগ্যতা পরীক্ষা করুন 🏦
**2.** ক্রেডিট স্কোর উন্নত করুন 📈
**3.** নথি চেকলিস্ট 📄
**4.** নিয়ম ও প্রবিধান 📜
"""
    }
    
    greeting = greetings.get(language, greetings["en"])
    
    return {
        "session_id": session_id,
        "message": greeting if not chat_history else "Welcome back! I've restored your previous chat.",
        "suggested_questions": suggested_questions,
        "chat_history": chat_history
    }


class RAGQuery(BaseModel):
    query: str

@app.post("/chat/clear/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session"""
    sessions.clear(session_id)
    return {"status": "success", "message": "Chat history cleared"}


@app.post("/rag/query")
@limiter.limit("100/day", key_func=standard_key)
async def rag_query(request: Request, query_data: RAGQuery):
    """
    Query RBI regulations using RAG.
    """
    answer = await query_rbi_docs(query_data.query)
    return {"answer": answer}


@app.post("/chat/voice")
@limiter.limit("100/day", key_func=standard_key)
async def voice_chat(
    request: Request,
    background_tasks: BackgroundTasks,
    session_id: str = Form(...),
    audio: UploadFile = File(None),
    text_input: str = Form(None),
    language: str = Form("en")
):
    """
    Main chat endpoint with optimizations:
    - Streaming-ready response structure
    - Background TTS/PDF generation
    - Consolidated AI calls
    """
    # Get or create session
    session = sessions.get(session_id)
    if not session:
        session = LoanSession(session_id=session_id)
        sessions.set(session_id, session)
    
    # Handle shortcuts
    if text_input and text_input.strip() in ["1", "2", "3", "4"]:
        shortcuts = {
            "1": "Check my loan eligibility",
            "2": "How can I improve my credit score?",
            "3": "What documents are needed for a loan?",
            "4": "Tell me about banking rules and regulations"
        }
        text_input = shortcuts[text_input.strip()]
    
    # Build context
    missing_fields = get_missing_fields(session)
    next_field = missing_fields[0] if missing_fields else None
    next_key = FIELD_TO_KEY.get(next_field) if next_field else None
    
    # Language Mapping for AI instructions
    LANG_MAP = {
        "en": "English",
        "hi": "Hindi (Devanagari script)",
        "hinglish": "Hinglish (Hindi written in Latin script)",
        "te": "Telugu",
        "mr": "Marathi",
        "ta": "Tamil",
        "kn": "Kannada",
        "bn": "Bengali"
    }
    
    target_lang = LANG_MAP.get(language, "English")
    lang_instruction = f"CRITICAL: You MUST respond in {target_lang} ONLY, regardless of the language of the user's input. Do not switch to English unless the target language is English."
    if language == "hinglish":
        lang_instruction += " Keep it conversational and natural."
    
    # RAG Context Injection
    rbi_context = ""
    # Check if user is asking about rules/regulations or used option 4
    is_rag_query = False
    is_rbi_verified = False
    if text_input:
        keywords = [
            "rule", "regulation", "rbi", "bank", "law", "act", "guideline", "norm", "kyc", "repo", "interest", 
            "scam", "fraud", "fake", "fee", "charge", "upfront", "pay", "money",
            "literacy", "safety", "borrower", "right", "duty", "ombudsman", "complaint", "grievance"
        ]
        if "banking rules and regulations" in text_input.lower() or any(k in text_input.lower() for k in keywords):
            is_rag_query = True
    
    if is_rag_query and text_input:
        print(f"Fetching RAG context for: {text_input}")
        rbi_context, sources = await retrieve_context(text_input)
        
        # Determine if verified badge should be shown (Only for RBI docs and Fraud lists)
        verified_docs = [
            "Reserve Bank of India.pdf",
            "ALERTLIST-FRAUDCOMPANIES.PDF",
            "RBI-FRAUD-RISK-MANAGEMENT-15-07-24.pdf",
            "BANKI15122014.PDF",
            "rbi_fraud_user_notice.PDF"
        ]
        is_rbi_verified = any(doc in s for s in sources for doc in verified_docs)
        
        if rbi_context:
            citation_instruction = "2. Do NOT cite the specific filename (e.g., 'ALERTLIST-FRAUDCOMPANIES.PDF'). Instead, refer to it as 'RBI Alert List' or 'official guidelines'."
            if not is_rbi_verified:
                citation_instruction = "2. Do NOT mention the source name, filename, or 'According to...' in the response. Just give the answer directly."

            rbi_context = f"\n\nRELEVANT DOCUMENTS (SOURCE: {', '.join(sources)}):\n{rbi_context}\n\nINSTRUCTIONS:\n1. Answer based ONLY on the above documents.\n{citation_instruction}\n3. DO NOT give generic advice like 'check online' or 'consult a professional' if the answer is in the document.\n4. If the answer is NOT in the document, state that clearly."

    # Only inject missing fields if NOT a RAG query, or if RAG query is empty
    fields_prompt = ""
    if not is_rag_query:
        fields_prompt = f"""
FIELDS NEEDED: {missing_fields}
CURRENT QUESTION: "{next_field}"
JSON KEY TO USE: "{next_key}"
"""
    else:
        fields_prompt = "FIELDS NEEDED: [] (SUPPRESSED FOR REGULATORY QUERY)"

    dynamic_prompt = BASE_SYSTEM_INSTRUCTION + f"""

{rbi_context}

SESSION STATE:
{session.model_dump_json(exclude={'chat_history', 'session_id'})}

{fields_prompt}

{lang_instruction}

USER MESSAGE:
"""
    
    # Build content
    user_content = [dynamic_prompt]
    
    if audio:
        audio_bytes = await audio.read()
        user_content.append({"mime_type": "audio/webm", "data": audio_bytes})
        # Save user audio message (placeholder text for now)
        # This will be replaced by the actual transcription from the LLM response
        # save_message(session_id, "user", "[Audio Message]", get_user_email(request))
    elif text_input:
        user_content.append(text_input)
        save_message(session_id, "user", text_input, get_user_email(request))
    else:
        raise HTTPException(status_code=400, detail="No input provided")
    
    # Call Gemini
    try:
        response = model.generate_content(
            user_content,
            generation_config={"response_mime_type": "application/json"}
        )
        clean_text = clean_json_string(response.text)
        llm_data = json.loads(clean_text)
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        return ChatResponse(
            response_text="I'm having trouble processing that. Please try again."
        )
    except Exception as e:
        print(f"Gemini Error: {e}")
        return ChatResponse(
            response_text=f"Connection error. Please try again."
        )
    
    # Update session
    if llm_data.get("extracted_updates"):
        try:
            print(f"DEBUG: Applying updates: {llm_data['extracted_updates']}")
            session = sessions.update_from_dict(session_id, llm_data["extracted_updates"])
        except Exception as e:
            print(f"ERROR: Session update failed: {e}")
            # Optional: Add error feedback to response_text so user knows something went wrong
            # resp_text += " (Internal Error: Could not save data)"
    
    # Check completion
    remaining = get_missing_fields(session)
    is_ready = len(remaining) == 0 or llm_data.get("is_ready", False)
    
    resp_text = llm_data.get("response_text", "")
    user_transcription = llm_data.get("user_transcription")
    chart_data = None
    report_url = None
    audio_url = None
    
    # Save transcription if available
    if user_transcription:
        save_message(session_id, "user", user_transcription, get_user_email(request))
    
    # Run audit if ready
    if is_ready:
        audit = calculate_score_and_decision(session)
        
        # Generate summary with single AI call
        summary_prompt = f"""
        Generate a warm, helpful response for this audit result:
        - Score: {audit['score']}/900
        - Decision: {audit['decision']}
        - Reason: {audit['reason']}
        - Red Flags: {', '.join(audit['red_flags'])}
        - Strengths: {', '.join(audit['strengths'])}
        
        Be encouraging and explain the next steps. Keep it under 200 words.
        """
        
        try:
            summary_resp = model.generate_content(summary_prompt)
            resp_text = summary_resp.text
        except:
            resp_text = f"**Score: {audit['score']}/900** | **{audit['decision']}**\n\n{audit['reason']}"
        
        # Background PDF generation
        background_tasks.add_task(generate_pdf_sync, session_id, audit)
        report_url = f"/download/report_{session_id}.pdf"
        
        # Chart data
        chart_data = {
            "type": "audit_complete",
            "data": {
                "healthScore": audit["health_score"],
                "radarData": audit["radar_data"],
                "redFlags": audit["red_flags"],
                "strengths": audit["strengths"],
                "recommendedActions": audit["plan"],
                "summary": f"Credit score: {audit['score']}. {audit['reason']}"
            }
        }
    
    # Background TTS generation
    background_tasks.add_task(generate_tts_sync, resp_text, session_id)
    audio_url = f"/audio/{session_id}"
    
    # Save assistant response
    save_message(session_id, "assistant", resp_text, get_user_email(request))

    return ChatResponse(
        response_text=resp_text,
        user_transcription=user_transcription,
        audio_url=audio_url,
        chart_data=chart_data,
        report_url=report_url,
        is_rbi_verified=is_rbi_verified
    )


    return {"answer": answer}


@app.get("/chat/stream/{session_id}")
async def stream_chat(session_id: str, message: str):
    """
    SSE streaming endpoint for real-time responses.
    Usage: EventSource('/chat/stream/{session_id}?message=hello')
    """
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    async def generate():
        try:
            # Build prompt
            missing = get_missing_fields(session)
            next_field = missing[0] if missing else None
            
            prompt = BASE_SYSTEM_INSTRUCTION + f"""
SESSION: {session.model_dump_json(exclude={'chat_history'})}
FIELDS NEEDED: {missing}
USER: {message}
"""
            
            # Stream from Gemini
            response = model.generate_content(prompt, stream=True)
            
            full_text = ""
            for chunk in response:
                if chunk.text:
                    full_text += chunk.text
                    yield f"data: {json.dumps({'type': 'text', 'content': chunk.text})}\n\n"
            
            yield f"data: {json.dumps({'type': 'done', 'content': full_text})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/download/{filename}")
def download_file(filename: str):
    """Download generated files (PDFs, audio)"""
    path = f"backend/data/{filename}"
    if os.path.exists(path):
        return FileResponse(path, filename=filename)
    raise HTTPException(status_code=404, detail="File not found")


@app.get("/audio/{session_id}")
def get_audio(session_id: str):
    """Get TTS audio for a session"""
    path = f"backend/data/audio_{session_id}.mp3"
    if os.path.exists(path):
        return FileResponse(path, media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio not ready yet")


@app.get("/report/sample")
def get_sample_report():
    """Generate and return a Gold Standard sample PDF"""
    try:
        # Create a mock session with perfect data
        sample_id = "sample_demo_123"
        session = LoanSession(
            session_id=sample_id,
            annual_income=5000000.0,  # 50 Lakhs
            monthly_debt=20000.0,     # Low debt
            loan_amount=1000000.0,    # 10 Lakhs
            payment_history_rating=60, # Perfect
            credit_utilization=0.10,   # 10%
            credit_history_years=8,
            open_credit_lines=5,
            recent_inquiries=0,
            bankruptcy_history=0,
            defaults_history=0
        )
        
        # Calculate audit
        audit = calculate_score_and_decision(session)
        
        # --- SHOWCASE OVERRIDE: Inject depth for the Demo Report ---
        audit["score"] = 864  # Keep high score
        audit["decision"] = "APPROVED"
        audit["reason"] = "Your financial profile demonstrates strong stability with consistent income growth. While credit card utilization is slightly elevated, your impeccable repayment history and diverse credit mix make you a prime candidate for premium lending tiers."
        
        audit["red_flags"] = [
            "Credit utilization ratio spiked to 45% in the last billing cycle (Ideal: <30%).",
            "High frequency of small-ticket personal loan inquiries in Q3.",
            "Average monthly balance dropped by 15% compared to the previous fiscal year."
        ]
        
        audit["strengths"] = [
            "Zero payment defaults recorded over a 7-year credit history.",
            "Healthy mix of secured (Home Loan) and unsecured credit lines.",
            "Debt-to-Income (DTI) ratio is at a healthy 28%, significantly below the 40% threshold.",
            "Consistent income deposits detected from verified employer sources."
        ]
        
        audit["plan"] = [
            "Pay down credit card outstanding balance by ₹1.5L to optimize utilization score.",
            "Avoid applying for new unsecured loans for 6 months to stabilize inquiry rate.",
            "Maintain a minimum average quarterly balance (AQB) of ₹50,000 to improve banking variance score.",
            "Consolidate two active consumer durable loans to reduce EMI clutter."
        ]
        # -----------------------------------------------------------
        
        # Generate PDF
        filename = generate_pdf_sync(sample_id, audit)
        path = f"backend/data/{filename}"
        
        return FileResponse(
            path, 
            filename="CreditSetu_Sample_Report.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        print(f"Sample Gen Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)