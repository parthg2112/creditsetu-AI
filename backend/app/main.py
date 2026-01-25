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
from app.utils.supabase_client import save_message, get_chat_history, get_latest_session
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
allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",")]
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


# --- 5. BACKGROUND TASKS ---

def generate_pdf_sync(session_id: str, audit_data: Dict[str, Any]) -> str:
    """Synchronous PDF generation (runs in background)"""
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, txt="CREDITSETU AI - CREDIT READINESS AUDIT", ln=1, align='C')
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(0, 10, txt=f"Session: {session_id[:8]}...", ln=1, align='C')
    pdf.ln(10)
    
    # Executive Summary
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt="1. EXECUTIVE SUMMARY", ln=1, fill=True)
    pdf.ln(2)
    
    score = audit_data["score"]
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(50, 10, txt=f"Credit Score: {score}/900", ln=1)
    
    # Score bar
    pdf.set_fill_color(200, 200, 200)
    pdf.rect(10, pdf.get_y(), 180, 5, 'F')
    score_pct = (score - 300) / 600
    if score >= 750:
        pdf.set_fill_color(100, 180, 100)
    elif score >= 650:
        pdf.set_fill_color(200, 200, 100)
    else:
        pdf.set_fill_color(200, 100, 100)
    pdf.rect(10, pdf.get_y(), 180 * score_pct, 5, 'F')
    pdf.ln(8)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt=f"Decision: {audit_data['decision']}", ln=1)
    pdf.set_font("Arial", '', 11)
    pdf.multi_cell(0, 7, txt=f"Reasoning: {audit_data['reason']}")
    pdf.ln(5)
    
    # Factor Analysis
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt="2. FACTOR ANALYSIS", ln=1, fill=True)
    pdf.ln(2)
    pdf.set_font("Arial", '', 10)
    
    for item in audit_data["radar_data"]:
        name = item['letter']
        val = item['frequency']
        status = "Good" if val > 70 else "Average" if val > 40 else "Needs Work"
        pdf.cell(80, 8, f" {name}", 1)
        pdf.cell(40, 8, f" {val}/100", 1)
        pdf.cell(70, 8, f" {status}", 1)
        pdf.ln()
    pdf.ln(5)
    
    # Red Flags
    if audit_data["red_flags"]:
        pdf.set_fill_color(255, 235, 235)
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, txt="3. RISK FACTORS", ln=1, fill=True)
        pdf.ln(2)
        pdf.set_font("Arial", '', 11)
        pdf.set_text_color(200, 50, 50)
        for flag in audit_data["red_flags"]:
            pdf.multi_cell(0, 7, txt=f"- {flag}")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
    
    # Strengths
    if audit_data["strengths"]:
        pdf.set_fill_color(235, 255, 235)
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, txt="4. STRENGTHS", ln=1, fill=True)
        pdf.ln(2)
        pdf.set_font("Arial", '', 11)
        pdf.set_text_color(50, 150, 50)
        for s in audit_data["strengths"]:
            pdf.multi_cell(0, 7, txt=f"- {s}")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
    
    # Action Plan
    pdf.set_fill_color(240, 240, 250)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt="5. ACTION PLAN", ln=1, fill=True)
    pdf.ln(2)
    pdf.set_font("Arial", '', 11)
    for p in audit_data["plan"]:
        pdf.multi_cell(0, 7, txt=f"- {p}")
    
    # Footer
    pdf.set_y(-30)
    pdf.set_font("Arial", 'I', 8)
    pdf.cell(0, 10, "AI-generated report. For informational purposes only.", align='C')
    
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
   - **HANDLE INDIAN FORMATS:**
     - "1 Lakh" or "1L" -> 100000
     - "1 Crore", "1 Cr", "1cr" -> 10000000
     - "50k" -> 50000
   - **HANDLE RANGES:** If user gives a range (e.g., "10-12 Lakhs", "100-500 cr"), calculate and use the **AVERAGE**.
   - If input is ambiguous, ask for clarification.
3. **NO HALLUCINATIONS:** Never assume a value (especially bankruptcy/defaults) from an unrelated answer.

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
  "response_text": "Your response...",
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

**1.** లోన్ అర్హతను తನಿఖీ చేయండి 🏦
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


@app.post("/chat/voice")
@limiter.limit("10000/day", key_func=whitelist_key)
@limiter.limit("10/day", key_func=standard_key)
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
        session = sessions.update_from_dict(session_id, llm_data["extracted_updates"])
    
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



class RAGQuery(BaseModel):
    query: str

@app.post("/rag/query")
@limiter.limit("100/day", key_func=standard_key)
async def rag_query(request: Request, query_data: RAGQuery):
    """
    Query RBI regulations using RAG.
    """
    answer = await query_rbi_docs(query_data.query)
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)