# backend/app/main.py
import os
import shutil
import uuid
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_parse import LlamaParse
import google.generativeai as genai
from dotenv import load_dotenv

# Import our custom modules
from .models import LoanApplicationSchema, AgentResponse
from .agent import orchestrate_loan

# Load Environment Variables
load_dotenv()

app = FastAPI(title="Creditsetu AI Backend")

# CORS Setup (Allows Frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Clients
try:
    parser = LlamaParse(
        api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
        result_type="markdown",
        verbose=True
    )
    # Using Gemini as requested in your snippet
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    gemini_model = genai.GenerativeModel("gemini-2.0-flash")
except Exception as e:
    print(f"WARNING: AI Clients not initialized. Check .env file. Error: {e}")

UPLOAD_DIR = "backend/data/raw"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- HELPER: HEURISTIC SCORE CALCULATION ---
def calculate_heuristic_score(user: LoanApplicationSchema) -> int:
    """
    Approximates a Credit Score (300-900) using FICO-like weightages.
    Used as a fallback when the Credit Score is missing in the input PDF.
    """
    score = 300.0  # Baseline (Worst possible score)
    
    # 1. Payment History (35% Weight) -> Max 210 points
    # Logic: PaymentHistory is 0-60 in your schema. We scale it.
    if user.PaymentHistory is not None:
        payment_points = (user.PaymentHistory / 60) * 210
        score += payment_points

    # 2. Credit Utilization (30% Weight) -> Max 180 points
    # Logic: Lower is better. < 10% util = max points. > 100% util = 0 points.
    if user.CreditCardUtilizationRate is not None:
        util_ratio = user.CreditCardUtilizationRate
        if util_ratio < 0.1:
            util_points = 180
        elif util_ratio > 1.0:
            util_points = 0
        else:
            # Linear drop off: (1 - util) * factor
            util_points = 180 * (1 - util_ratio)
        score += util_points

    # 3. Credit History Length (15% Weight) -> Max 90 points
    # Logic: More years = better. Cap at 10 years for max points.
    if user.LengthOfCreditHistory is not None:
        years = user.LengthOfCreditHistory
        history_points = min(years, 10) * 9  # 9 points per year, max 90
        score += history_points

    # 4. Credit Mix (10% Weight) -> Max 60 points
    # Logic: Having diverse credit is good. We use 'NumberOfOpenCreditLines'.
    if user.NumberOfOpenCreditLines is not None:
        if user.NumberOfOpenCreditLines >= 5:
            mix_points = 60
        elif user.NumberOfOpenCreditLines >= 2:
            mix_points = 40
        else:
            mix_points = 10
        score += mix_points

    # 5. New Credit / Inquiries (10% Weight) -> Max 60 points
    # Logic: Fewer inquiries is better. 0 inquiries = max points.
    if user.NumberOfCreditInquiries is not None:
        inquiries = user.NumberOfCreditInquiries
        if inquiries == 0:
            new_credit_points = 60
        elif inquiries <= 2:
            new_credit_points = 40
        elif inquiries <= 5:
            new_credit_points = 20
        else:
            new_credit_points = 0
        score += new_credit_points

    # 6. Negative Penalties (Critical Failures)
    if user.BankruptcyHistory == 1:
        score -= 150
    if user.PreviousLoanDefaults == 1:
        score -= 100

    # Ensure we stay within 300-900 range and return integer
    return int(max(300, min(900, score)))

# --- PDF EXTRACTION LOGIC ---
async def extract_data_from_pdf(file_path: str) -> LoanApplicationSchema:
    """
    Helper function: PDF -> Markdown -> JSON
    """
    print(f"📄 Parsing PDF: {file_path}...")
    
    # 1. Parse PDF using LlamaParse
    documents = await parser.aload_data(file_path)
    extracted_text = "\n\n".join([doc.text for doc in documents])
    
    # 2. Extract Structured Data using LLM (Gemini)
    print("🧠 Extracting JSON variables...")
    
    # We pass the Pydantic schema as a hint to the LLM
    schema_json = LoanApplicationSchema.model_json_schema()
    
    # Clean string for Gemini prompt
    clean_text = extracted_text[:30000] # Safety clip for token limits if file is huge
    
    prompt = f"""
    You are an expert Data Extraction AI for a Bank.
    Extract the following loan application details from the document text provided below.
    Return ONLY valid JSON matching the provided schema. Do not wrap in markdown code blocks.

    CRITICAL RULES:
    - If specific numbers are missing, infer reasonable defaults based on context.
    - If 'NetWorth' is missing, calculate it as (TotalAssets - TotalLiabilities).
    - If 'CreditCardUtilizationRate' is missing, estimate it based on credit score (High score = low util).
    - Convert all percentages to decimals (e.g., 30% -> 0.30).
    - If CreditScore is not found, return null or 0.

    Target Schema: {json.dumps(schema_json)}

    Document Content:
    {clean_text}
    """

    response = gemini_model.generate_content(prompt)
    
    # Parse JSON response
    try:
        # Handle potential markdown wrapping from LLM
        response_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(response_text)
        return LoanApplicationSchema(**data)
    except Exception as e:
        print(f"JSON Parse Error: {response.text}")
        raise HTTPException(status_code=500, detail="Failed to parse PDF data into JSON schema.")

# --- API ENDPOINTS ---
@app.post("/analyze-document", response_model=AgentResponse)
async def analyze_document(file: UploadFile = File(...)):
    """
    Main Endpoint: 
    1. Saves uploaded PDF
    2. Extracts data (RAG)
    3. CHECKS FOR MISSING SCORE -> Calculates Heuristic if needed
    4. Runs Orchestrator (Logic)
    5. Returns Decision
    """
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    # Save the file locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Step 1: Extract Data
        user_data = await extract_data_from_pdf(file_path)
        
        # Step 2: Handle Missing Credit Score (The Heuristic Fallback)
        # We check if it is None, 0, or absurdly low (<300 which shouldn't happen but good safety)
        if user_data.CreditScore is None or user_data.CreditScore == 0:
            print("🔍 Credit Score missing. Calculating via Heuristic Formula...")
            
            # Apply the formula
            calculated_score = calculate_heuristic_score(user_data)
            user_data.CreditScore = calculated_score
            
            print(f"💡 Calculated Score: {user_data.CreditScore}")
        
        # Step 3: Run Logic (Orchestrator)
        decision = orchestrate_loan(user_data)
        
        return decision

    except Exception as e:
        print(f"❌ Error processing file: {str(e)}")
        # Return a clean HTTP exception so frontend knows what happened
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup: Remove file after processing
        if os.path.exists(file_path):
            os.remove(file_path)

@app.get("/")
def health_check():
    return {"status": "Active", "module": "Creditsetu AI Backend"}