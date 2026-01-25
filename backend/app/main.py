import os
import uuid
import json
import base64
import re  # ADDED: For robust JSON cleaning
from typing import Dict, List, Optional, Any
from io import BytesIO

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from fpdf import FPDF
from gtts import gTTS
import google.generativeai as genai
from dotenv import load_dotenv

# --- 1. CONFIGURATION & SETUP ---
load_dotenv()
app = FastAPI(title="Creditsetu AI Consultant (Conversational Edition)")

# CORS: Allow connection from any frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Client Setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
# Using Flash for low latency conversational speed
model = genai.GenerativeModel("gemini-2.0-flash")

# --- 2. DATA MODELS (STATE MANAGEMENT) ---

class LoanSession(BaseModel):
    session_id: str
    # Chat History for Context
    chat_history: List[Dict[str, str]] = [] 
    
    # --- The 3 Variables for Approval ---
    annual_income: Optional[float] = None
    monthly_debt: Optional[float] = None
    loan_amount: Optional[float] = None
    
    # --- The 7 Variables for Score ---
    payment_history_rating: Optional[int] = Field(None, description="0-60 score")
    credit_utilization: Optional[float] = Field(None, description="0.0-1.0")
    credit_history_years: Optional[int] = None
    open_credit_lines: Optional[int] = None
    recent_inquiries: Optional[int] = None
    bankruptcy_history: Optional[int] = None # 0 or 1
    defaults_history: Optional[int] = None    # 0 or 1

class ChatResponse(BaseModel):
    response_text: str
    audio_base64: Optional[str] = None # Voice Output
    chart_data: Optional[Dict[str, Any]] = None # Visuals
    report_url: Optional[str] = None   # PDF Link

# In-Memory Database (Resets on restart)
SESSIONS: Dict[str, LoanSession] = {}

# --- 3. HELPER: IDENTIFY MISSING DATA ---
def get_missing_fields(session: LoanSession) -> List[str]:
    """
    Checks which of the 10 mandatory parameters are still missing.
    """
    missing = []
    # Approval Params
    if session.annual_income is None: missing.append("Annual Income")
    if session.monthly_debt is None: missing.append("Monthly Debt Payments")
    if session.loan_amount is None: missing.append("Requested Loan Amount")
    
    # Score Params
    if session.payment_history_rating is None: missing.append("Payment Reliability (0-60)")
    if session.credit_utilization is None: missing.append("Credit Card Utilization %")
    if session.credit_history_years is None: missing.append("Credit History Length (Years)")
    if session.open_credit_lines is None: missing.append("Number of Active Credit Lines")
    if session.recent_inquiries is None: missing.append("Recent Inquiries (Last 6 months)")
    if session.bankruptcy_history is None: missing.append("Bankruptcy History (Yes/No)")
    if session.defaults_history is None: missing.append("Loan Default History (Yes/No)")
    
    return missing

# --- ADDED HELPER: CLEAN JSON ---
def clean_json_string(json_str: str) -> str:
    """
    Removes markdown code blocks and cleanup json string to prevent parsing errors.
    """
    cleaned = re.sub(r'```json\s*', '', json_str)
    cleaned = re.sub(r'```\s*', '', cleaned)
    return cleaned.strip()

# --- 4. ENGINE: HEURISTIC CALCULATOR & LOGIC ---
def calculate_score_and_decision(data: LoanSession):
    """
    The Mathematical Brain. Returns detailed audit data.
    """
    score = 300 # Baseline
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
    if pay_hist < 40: red_flags.append("Payment history is below average. Avoid missing any future payments.")
    else: strengths.append("Strong payment reliability record.")
    
    # 2. Utilization (30%) - Max 180
    score_util = 0
    if util <= 1.0:
        score_util = 180 * (1.0 - util)
        score += score_util
    if util > 0.4: red_flags.append(f"Credit utilization is high ({int(util*100)}%). Try to keep it under 30%.")
    else: strengths.append("Healthy credit utilization ratio.")
        
    # 3. History Length (15%) - Max 90
    score_age = min(hist_len, 10) * 9
    score += score_age
    if hist_len < 3: plan.append("Keep your oldest accounts open to build credit history length.")
    
    # 4. Credit Mix (10%) - Max 60
    score_mix = 0
    if lines >= 5: score_mix = 60
    elif lines >= 2: score_mix = 40
    else: score_mix = 20
    score += score_mix
        
    # 5. New Credit (10%) - Max 60
    score_new = 0
    if inq == 0: score_new = 60
    elif inq <= 2: score_new = 40
    else: score_new = 20
    score += score_new
    if inq > 3: red_flags.append(f"Too many recent inquiries ({inq}). Pause applying for new credit.")
    
    # Critical Penalties
    if data.bankruptcy_history == 1: 
        score -= 150
        red_flags.append("Bankruptcy history significantly impacts your score.")
    if data.defaults_history == 1: 
        score -= 100
        red_flags.append("Past loan defaults are a major negative factor.")
    
    if dti > 0.4: red_flags.append(f"High Debt-to-Income Ratio ({int(dti*100)}%). Banks prefer <40%.")
    elif dti < 0.3: strengths.append("Excellent Debt-to-Income ratio.")

    final_score = int(max(300, min(900, score)))

    # Decision Logic
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
    
    # Indian context advice
    plan.append("Ensure your ITR reflects this income to pass bank verification.")

    # Radar Data Construction
    radar_data = [
        {"letter": "Payment", "frequency": int((score_payment/210)*100)},
        {"letter": "Usage", "frequency": int((score_util/180)*100)},
        {"letter": "Age", "frequency": int((score_age/90)*100)},
        {"letter": "Mix", "frequency": int((score_mix/60)*100)},
        {"letter": "New Credit", "frequency": int((score_new/60)*100)},
        {"letter": "DTI", "frequency": max(0, 100 - int(dti*100))}
    ]
        
    return final_score, decision, reason, plan, red_flags, strengths, radar_data

# --- 5. ENGINE: PDF GENERATOR ---
def generate_pdf(session_id, score, decision, reason, plan, red_flags, strengths, radar_data):
    pdf = FPDF()
    pdf.add_page()
    
    # --- HEADER ---
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, txt="LENDREADY AI - CREDIT READINESS AUDIT", ln=1, align='C')
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(0, 10, txt=f"Session Reference: {session_id[:8]}...", ln=1, align='C')
    pdf.ln(10)
    
    # --- EXECUTIVE SUMMARY ---
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt="1. EXECUTIVE SUMMARY", ln=1, fill=True)
    pdf.ln(2)
    
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(50, 10, txt=f"Credit Score: {score}/900", ln=1)
    
    # Visual Score Bar (ASCII-ish)
    # Draw gray bar
    pdf.set_fill_color(200, 200, 200)
    pdf.rect(10, pdf.get_y(), 180, 5, 'F')
    # Draw score bar
    score_pct = (score - 300) / 600
    if score >= 750: pdf.set_fill_color(100, 180, 100) # Green
    elif score >= 650: pdf.set_fill_color(200, 200, 100) # Yellow
    else: pdf.set_fill_color(200, 100, 100) # Red
    pdf.rect(10, pdf.get_y(), 180 * score_pct, 5, 'F')
    pdf.ln(8)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt=f"Decision: {decision}", ln=1)
    pdf.set_font("Arial", '', 11)
    pdf.multi_cell(0, 7, txt=f"Reasoning: {reason}")
    pdf.ln(5)
    
    # --- FACTOR ANALYSIS ---
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt="2. DETAILED FACTOR ANALYSIS", ln=1, fill=True)
    pdf.ln(2)
    
    pdf.set_font("Arial", '', 10)
    # Table Header
    pdf.cell(80, 8, "Factor", 1)
    pdf.cell(40, 8, "Impact", 1)
    pdf.cell(70, 8, "Assessment", 1)
    pdf.ln()
    
    for item in radar_data:
        name = item['letter']
        val = item['frequency']
        status = "Good" if val > 70 else "Average" if val > 40 else "Needs Work"
        pdf.cell(80, 8, f" {name}", 1)
        pdf.cell(40, 8, f" {val}/100", 1)
        pdf.cell(70, 8, f" {status}", 1)
        pdf.ln()
    pdf.ln(5)

    # --- RED FLAGS ---
    if red_flags:
        pdf.set_fill_color(255, 235, 235) # Light Red
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, txt="3. CRITICAL RISK FACTORS (Red Flags)", ln=1, fill=True)
        pdf.ln(2)
        pdf.set_font("Arial", '', 11)
        pdf.set_text_color(200, 50, 50)
        for flag in red_flags:
            pdf.multi_cell(0, 7, txt=f"• {flag}")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        
    # --- STRENGTHS ---
    if strengths:
        pdf.set_fill_color(235, 255, 235) # Light Green
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, txt="4. CREDIT STRENGTHS", ln=1, fill=True)
        pdf.ln(2)
        pdf.set_font("Arial", '', 11)
        pdf.set_text_color(50, 150, 50)
        for s in strengths:
            pdf.multi_cell(0, 7, txt=f"• {s}")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)

    # --- ROADMAP ---
    pdf.set_fill_color(240, 240, 250) # Light Blue
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt="5. RECOMMENDED ACTION PLAN", ln=1, fill=True)
    pdf.ln(2)
    pdf.set_font("Arial", '', 11)
    for p in plan:
        pdf.multi_cell(0, 7, txt=f"• {p}")
    pdf.ln(5)
    
    # Footer disclaimer
    pdf.set_y(-30)
    pdf.set_font("Arial", 'I', 8)
    pdf.cell(0, 10, "This report is generated by AI and is indicative only. Not a legal financial document.", align='C')

    filename = f"report_{session_id}.pdf"
    path = f"backend/data/{filename}"
    os.makedirs("backend/data", exist_ok=True)
    pdf.output(path)
    return filename

# --- 6. THE DUAL-MODE SYSTEM PROMPT (UPDATED FOR ADVISORY & ROBUSTNESS) ---
BASE_SYSTEM_INSTRUCTION = """
You are Creditsetu, an expert Indian AI Loan Consultant.

**YOUR MODES (Auto-Switch based on context):**

1. **ADVISORY & EDUCATION (Default for "How to", "Help me", "Education Loan"):**
   - If user asks about improving scores or specific loan types (e.g. "Education Loan for daughter"), provide SMART ADVICE immediately.
   - Do NOT force the full 10-variable collection unless they explicitly ask to "Check my Score" or "Audit my Profile".
   - You can ask 1-2 relevant questions (e.g. "What is the course fee?" for edu loans) but keep it conversational.

2. **APPROVAL AGENT (Triggered by "Am I eligible?", "Check Score", or providing data):**
   - In this mode, collect the 10 Mandatory Variables one by one.
   - **CRITICAL:** When the user provides a number (e.g., "35 lacks", "250000", "₹5 Lakh"), YOU MUST extract it and put it in `extracted_updates`.
   - **ROBUSTNESS:** If the user answers vaguely (e.g. "I don't have debt"), infer the value (e.g. `monthly_debt: 0`) and extract it.

**MANDATORY VARIABLES (for Mode 2 - Audit):**
1. `loan_amount` - Loan Amount Needed (in Rupees)
2. `annual_income` - Annual Income (in Rupees)
3. `monthly_debt` - Monthly Debt Payments (in Rupees)
4. `payment_history_rating` - Payment Reliability (0-60 scale)
5. `credit_utilization` - Credit Card Utilization (0.0-1.0, e.g., 0.3 for 30%)
6. `credit_history_years` - Credit History Length (Years)
7. `open_credit_lines` - Active Credit Lines (Count)
8. `recent_inquiries` - Recent Inquiries (Count in last 6 months)
9. `bankruptcy_history` - Bankruptcy History (0 for No, 1 for Yes)
10. `defaults_history` - Default History (0 for No, 1 for Yes)

**EXTRACTION EXAMPLES:**
- User: "₹5 Lakh" -> `{"extracted_updates": {"loan_amount": 500000}}`
- User: "35 lacks" -> `{"extracted_updates": {"annual_income": 3500000}}`
- User: "No EMIs" or "0" -> `{"extracted_updates": {"monthly_debt": 0}}`
- User: "My score is low, help me" -> `{"response_text": "To improve your score, focus on paying dues on time. Do you want a full audit?"}` (No extraction needed unless numbers given)

**OUTPUT JSON FORMAT (ALWAYS use this format, NO Markdown):**
{
  "response_text": "Your helpful response...",
  "extracted_updates": {"field_name": numeric_value},
  "is_ready": false,
  "chart": null
}
"""

# --- 7. API ENDPOINTS ---

@app.post("/chat/init")
def init_chat(language: str = "en"):
    """
    Initializes a new session and sends Predefined Questions to the Frontend.
    """
    sid = str(uuid.uuid4())
    SESSIONS[sid] = LoanSession(session_id=sid)
    
    # Feature: Predefined Questions (Demo Set)
    suggested_questions = [
        "Analyze ₹12 Lakh Home Loan Eligibility 🏠",
        "I earn ₹1L/month. What's my max loan? 💰",
        "Check readiness for Business Loan 💼",
        "Generate Comprehensive Audit PDF 📄"
    ]
    
    greeting = """**Welcome to CreditSetu AI.** 👋

I am your personal financial auditor. To get started, type a number:

**1.** Check Loan Eligibility 🏦\n
**2.** Improve Credit Score 📈\n
**3.** Document Checklist 📄\n
**4.** Full Audit for ₹5 Lakhs ✅\n
"""
    
    if language != "en":
        greeting += f"\n\n(Note: I will respond in {language.upper()} from now on)"
    
    return {
        "session_id": sid, 
        "message": greeting,
        "suggested_questions": suggested_questions
    }

@app.post("/chat/voice", response_model=ChatResponse)
async def voice_chat_google(
    session_id: str = Form(...),
    audio: UploadFile = File(None),
    text_input: str = Form(None),
    language: str = Form("en")
):
    """
    Multimodal Endpoint: Accepts Voice (Audio) or Text -> Gemini -> Logic -> TTS -> Response.
    """
    if session_id not in SESSIONS:
        SESSIONS[session_id] = LoanSession(session_id=session_id)
    session = SESSIONS[session_id]

    # Feature: Quick Shortcuts (1, 2, 3, 4)
    if text_input and text_input.strip() in ["1", "2", "3", "4"]:
        shortcuts = {
            "1": "Am I eligible for a Personal Loan? Check my eligibility.",
            "2": "How can I improve my CIBIL score? Suggest ways.",
            "3": "What documents are required for a loan?",
            "4": "Check my readiness for a ₹5 Lakhs loan."
        }
        text_input = shortcuts[text_input.strip()]

    # A. IDENTIFY MISSING FIELDS
    missing_fields = get_missing_fields(session)
    next_field = missing_fields[0] if missing_fields else None
    
    # B. CONSTRUCT DYNAMIC PROMPT
    force_english_response = (audio is not None)
    
    if force_english_response:
        lang_instruction = "IMPORTANT: Respond in English language only."
    else:
        lang_instruction = f"IMPORTANT: Respond in {language} language only." if language != "en" else ""
    
    dynamic_instruction = BASE_SYSTEM_INSTRUCTION + f"""
    
    ===== CURRENT SESSION STATE =====
    COLLECTED DATA: {session.json(exclude={'chat_history', 'session_id'})}
    
    FIELDS STILL NEEDED: {missing_fields}
    
    NEXT FIELD TO COLLECT: {next_field}
    
    ===== ACTION REQUIRED =====
    1. Read the user's latest message below.
    2. If they provided a NUMBER or VALUE, extract it into `extracted_updates` using the appropriate field name.
    3. If the user asks for ADVICE (e.g. "How to improve score", "Education loan"), answer them helpfully WITHOUT forcing the next field question immediately, unless they want an audit.
    4. If collecting data: ask for the next missing field in {language} language.
    5. If ALL fields are collected (or user explicitly asks to calculate result based on current data), set "is_ready": true.
    
    USER MESSAGE:
    """

    user_content = []
    user_content.append(dynamic_instruction)
    
    # Feature: Multimodal Input (Audio/Text)
    if audio:
        audio_bytes = await audio.read()
        user_content.append({"mime_type": "audio/wav", "data": audio_bytes})
    elif text_input:
        user_content.append(text_input)

    # C. CALL GEMINI (First Pass - Extraction & Conversation)
    try:
        response = model.generate_content(
            user_content,
            generation_config={"response_mime_type": "application/json"}
        )
        # ADDED: Cleanup JSON string before parsing
        clean_text = clean_json_string(response.text)
        print(f"Gemini Raw Response: {clean_text[:500]}")
        llm_data = json.loads(clean_text)
    except json.JSONDecodeError as je:
        print(f"JSON Parse Error: {je}")
        print(f"Raw text was: {response.text[:1000]}")
        return ChatResponse(response_text="I understood your question, but I'm having trouble formatting my response. Please try again.")
    except Exception as e:
        import traceback
        print(f"Gemini Error: {e}")
        traceback.print_exc()
        return ChatResponse(response_text=f"I'm having trouble connecting to the brain. Error: {str(e)[:100]}")

    # D. UPDATE MEMORY
    if "extracted_updates" in llm_data and llm_data["extracted_updates"]:
        session_dict = session.dict()
        session_dict.update(llm_data["extracted_updates"])
        SESSIONS[session_id] = LoanSession(**session_dict)
        session = SESSIONS[session_id]

    # E. CHECK COMPLETION (Double-Validate with Python)
    remaining_missing = get_missing_fields(session)
    # Only calculate if LLM thinks it's ready AND Python confirms 0 missing fields
    is_really_ready = llm_data.get("is_ready", False) and len(remaining_missing) == 0
    
    resp_text = llm_data["response_text"]
    report_link = None
    chart = llm_data.get("chart")

    # Feature: Automated Decision Engine + SMART ADVICE GENERATION
    if is_really_ready:
        score, decision, reason, plan, red_flags, strengths, radar_data = calculate_score_and_decision(session)
        
        # --- NEW: ASK GEMINI TO GENERATE THE FINAL "SMART SUGGESTION" ---
        # Instead of just using the hardcoded string, we feed the math back to Gemini
        # to get a natural, helpful, and "smart" response.
        final_synthesis_prompt = f"""
        You are a smart financial advisor.
        The system has calculated the following audit results for the user:
        - CREDIT SCORE: {score}/900
        - DECISION: {decision}
        - KEY REASON: {reason}
        - RED FLAGS: {', '.join(red_flags)}
        - STRENGTHS: {', '.join(strengths)}
        - SUGGESTED PLAN STEPS: {', '.join(plan)}
        
        TASK: Generate a warm, encouraging, and intelligent response for the user (in {language}).
        - Announce the score and decision clearly.
        - Explain *why* (using the reason and red flags).
        - Provide the "Smart Suggestions" (using the plan steps but elaborating slightly).
        - Tell them a detailed PDF report is ready.
        """
        
        try:
            # Quick second call for high-quality synthesis
            synthesis_resp = model.generate_content(final_synthesis_prompt)
            resp_text = synthesis_resp.text
        except:
            # Fallback to hardcoded if second call fails
            resp_text = f"Analyzed! \n\n**Score: {score}/900**\n**Decision: {decision}**\n\n{reason}\n\nI've generated a detailed report for you."
        
        # Feature: PDF Report Generation
        fname = generate_pdf(session_id, score, decision, reason, plan, red_flags, strengths, radar_data)
        report_link = f"/download/{fname}"
        
        # Feature: Smart Visualization Data - FULL AUDIT
        chart = {
            "type": "audit_complete",
            "data": {
                "healthScore": int((score - 300) / 600 * 100),
                "radarData": radar_data,
                "redFlags": red_flags,
                "strengths": strengths,
                "recommendedActions": plan,
                "summary": f"Based on your profile, your credit score is {score}. {reason}"
            }
        }
    
    # F. TTS GENERATION (Feature: Voice Output)
    audio_b64 = None
    try:
        # Force English for Voice Output as requested ("speech we can keep it to english only")
        tts_lang = 'en'
        # Strip markdown asterisks for cleaner TTS
        clean_tts_text = resp_text.replace("**", "").replace("*", "")
        tts = gTTS(clean_tts_text[:500], lang=tts_lang) # Limit TTS length
        mp3_fp = BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        audio_b64 = base64.b64encode(mp3_fp.read()).decode()
    except:
        pass

    return ChatResponse(
        response_text=resp_text,
        audio_base64=audio_b64,
        chart_data=chart,
        report_url=report_link
    )

@app.get("/download/{filename}")
def download(filename: str):
    """
    Feature: File Download Endpoint
    """
    path = f"backend/data/{filename}"
    if os.path.exists(path):
        return FileResponse(path, filename=filename)
    raise HTTPException(status_code=404, detail="Report not found")

@app.get("/")
def health_check():
    return {"status": "Active", "mode": "Conversational Consultant"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)