import os
import uuid
import json
import base64
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

# --- 4. ENGINE: HEURISTIC CALCULATOR & LOGIC ---
def calculate_score_and_decision(data: LoanSession):
    """
    The Mathematical Brain. Returns (Score, Decision, Reason, Plan).
    """
    score = 300 # Baseline
    
    # Safe defaults to prevent math errors
    pay_hist = data.payment_history_rating or 0
    util = data.credit_utilization or 0.5
    hist_len = data.credit_history_years or 0
    lines = data.open_credit_lines or 0
    inq = data.recent_inquiries or 0
    
    # 1. Payment History (35%)
    score += (pay_hist / 60) * 210
    
    # 2. Utilization (30%)
    if util <= 1.0:
        score += 180 * (1.0 - util)
        
    # 3. History Length (15%)
    score += min(hist_len, 10) * 9
    
    # 4. Credit Mix (10%)
    if lines >= 5: score += 60
    elif lines >= 2: score += 40
    else: score += 20
        
    # 5. New Credit (10%)
    if inq == 0: score += 60
    elif inq <= 2: score += 40
    else: score += 20
    
    # Critical Penalties
    if data.bankruptcy_history == 1: score -= 150
    if data.defaults_history == 1: score -= 100
    
    final_score = int(max(300, min(900, score)))

    # Decision Logic
    decision = "APPROVED"
    reason = "Your profile meets our lending criteria."
    plan = []
    
    monthly_income = (data.annual_income or 1) / 12
    dti = (data.monthly_debt or 0) / monthly_income if monthly_income > 0 else 1.0
    
    # Rejection Logic
    if final_score < 650:
        decision = "REJECTED"
        reason = f"Credit Score {final_score} is too low (Min 650)."
        plan.append("Pay down credit card balances to <30%.")
        plan.append("No new loan applications for 6 months.")
    elif dti > 0.50:
        decision = "REJECTED"
        reason = f"Debt-to-Income Ratio {dti:.2f} is too high (Max 0.50)."
        plan.append("Consolidate existing debts to lower monthly EMI.")
    
    # Indian Context: ITR Advice (Included in Report)
    plan.append("IMPORTANT: Ensure your last 2 years of ITR (Income Tax Returns) match these income figures for final bank verification.")
        
    return final_score, decision, reason, plan

# --- 5. ENGINE: PDF GENERATOR ---
def generate_pdf(session_id, score, decision, reason, plan):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Creditsetu AI - Consultation Report", ln=1, align='C')
    pdf.ln(10)
    pdf.cell(0, 10, txt=f"Final Decision: {decision}", ln=1)
    pdf.cell(0, 10, txt=f"Calculated Credit Score: {score}", ln=1)
    pdf.cell(0, 10, txt=f"Primary Reason: {reason}", ln=1)
    pdf.ln(10)
    pdf.cell(0, 10, txt="Recommended Actions & Documentation:", ln=1)
    for p in plan:
        pdf.cell(0, 10, txt=f"- {p}", ln=1)
        
    filename = f"report_{session_id}.pdf"
    path = f"backend/data/{filename}"
    os.makedirs("backend/data", exist_ok=True)
    pdf.output(path)
    return filename

# --- 6. THE DUAL-MODE SYSTEM PROMPT (INDIAN CONTEXT) ---
BASE_SYSTEM_INSTRUCTION = """
You are Creditsetu, an expert Indian AI Loan Consultant.

**YOUR DUAL ROLES:**

**MODE A: GENERAL CONSULTANT (Default)**
- If the user asks general questions (e.g., "How much loan can I get with 50k salary?", "What is a good credit score?"), answer them directly.
- **PRIVACY RULE:** NEVER ask the user to send, upload, or share physical documents (like ITR, Bank Statements, Aadhaar) in the chat.

**MODE B: APPROVAL AGENT (Triggered by approval questions OR when collecting data)**
- **TRIGGER:** If the user asks "Will I get approved?", "Check my score", or "Am I eligible?", OR if we are already collecting data, switch to data collection mode.
- In this mode, collect the 10 Mandatory Variables one by one.
- **CRITICAL:** When the user provides a number (e.g., "35 lacks", "250000", "₹5 Lakh"), YOU MUST extract it and put it in `extracted_updates`.

**MANDATORY VARIABLES (for Mode B):**
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
- User: "250000" -> `{"extracted_updates": {"annual_income": 250000}}`
- User: "10 lakhs per year" -> `{"extracted_updates": {"annual_income": 1000000}}`
- User: "No EMIs" or "0" -> `{"extracted_updates": {"monthly_debt": 0}}`
- User: "Under 30%" or "25%" -> `{"extracted_updates": {"credit_utilization": 0.25}}`
- User: "No" for bankruptcy -> `{"extracted_updates": {"bankruptcy_history": 0}}`

**OUTPUT JSON FORMAT (ALWAYS use this format):**
{
  "response_text": "Your helpful response asking for the next missing field...",
  "extracted_updates": {"field_name": numeric_value},
  "is_ready": false,
  "chart": null
}
"""

# --- 7. API ENDPOINTS ---

@app.post("/chat/init")
def init_chat():
    """
    Initializes a new session and sends Predefined Questions to the Frontend.
    """
    sid = str(uuid.uuid4())
    SESSIONS[sid] = LoanSession(session_id=sid)
    
    # Feature: Predefined Questions
    suggested_questions = [
        "How much personal loan can I get with ₹50k salary?",
        "Check my Loan Approval Probability",
        "What documents do I need for a Home Loan?",
        "How do I improve my CIBIL score?"
    ]
    
    return {
        "session_id": sid, 
        "message": "Namaste! I am your AI Loan Consultant. You can ask me general questions about loans, ITR, or EMI. \n\nIf you want a full approval check, just ask 'Will I get approved?'",
        "suggested_questions": suggested_questions
    }

@app.post("/chat/voice", response_model=ChatResponse)
async def voice_chat_google(
    session_id: str = Form(...),
    audio: UploadFile = File(None),
    text_input: str = Form(None)
):
    """
    Multimodal Endpoint: Accepts Voice (Audio) or Text -> Gemini -> Logic -> TTS -> Response.
    """
    if session_id not in SESSIONS:
        SESSIONS[session_id] = LoanSession(session_id=session_id)
    session = SESSIONS[session_id]

    # A. IDENTIFY MISSING FIELDS
    missing_fields = get_missing_fields(session)
    next_field = missing_fields[0] if missing_fields else None
    
    # B. CONSTRUCT DYNAMIC PROMPT
    dynamic_instruction = BASE_SYSTEM_INSTRUCTION + f"""
    
    ===== CURRENT SESSION STATE =====
    COLLECTED DATA: {session.json(exclude={'chat_history', 'session_id'})}
    
    FIELDS STILL NEEDED: {missing_fields}
    
    NEXT FIELD TO COLLECT: {next_field}
    
    ===== ACTION REQUIRED =====
    1. Read the user's latest message below.
    2. If they provided a NUMBER or VALUE, extract it into `extracted_updates` using the appropriate field name.
    3. For example, if NEXT FIELD TO COLLECT is "Annual Income" and user says "35 lacks", respond with:
       {{"response_text": "Great, ₹35 Lakhs annual income noted...", "extracted_updates": {{"annual_income": 3500000}}, "is_ready": false, "chart": null}}
    4. Then ask for the next missing field.
    5. If ALL fields are collected, set "is_ready": true.
    
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

    # C. CALL GEMINI
    try:
        response = model.generate_content(
            user_content,
            generation_config={"response_mime_type": "application/json"}
        )
        print(f"Gemini Raw Response: {response.text[:500]}")
        llm_data = json.loads(response.text)
    except json.JSONDecodeError as je:
        print(f"JSON Parse Error: {je}")
        print(f"Raw text was: {response.text[:1000]}")
        # Fallback: Try to extract just the response text
        return ChatResponse(response_text="I understood your question, but I'm having trouble formatting my response. Please try again.")
    except Exception as e:
        import traceback
        print(f"Gemini Error: {e}")
        traceback.print_exc()
        return ChatResponse(response_text=f"I'm having trouble connecting to the brain. Error: {str(e)[:100]}")

    # D. UPDATE MEMORY
    if "extracted_updates" in llm_data:
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

    # Feature: Automated Decision Engine
    if is_really_ready:
        score, decision, reason, plan = calculate_score_and_decision(session)
        
        resp_text = f"Thank you! I have analyzed your profile. \n\nCalculated Credit Score: {score}\nDecision: {decision}\n\nReason: {reason}"
        
        # Feature: PDF Report Generation
        fname = generate_pdf(session_id, score, decision, reason, plan)
        report_link = f"/download/{fname}"
        
        # Feature: Smart Visualization Data
        chart = {
            "type": "doughnut",
            "labels": ["Score", "Max Potential"],
            "data": [score, 900-score],
            "colors": ["#4CAF50", "#E0E0E0"]
        }
    
    # F. TTS GENERATION (Feature: Voice Output)
    audio_b64 = None
    try:
        tts = gTTS(resp_text, lang='en')
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