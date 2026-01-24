from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import the Schema (Data Structure) and Logic (Brain)
# Ensure your models.py and agent.py are in the same 'app' folder
from .models import LoanApplicationSchema, AgentResponse
from .agent import orchestrate_loan

# Initialize the App
app = FastAPI(title="Creditsetu AI Backend")

# CORS Setup: Allows your frontend (React/Next.js) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/evaluate-loan", response_model=AgentResponse)
def evaluate_loan(application: LoanApplicationSchema):
    """
    ENDPOINT: Receives manual user data -> Calculates Score -> Returns Decision.
    
    Payload Example (Frontend sends this JSON):
    {
        "Age": 28,
        "EmploymentStatus": "Employed",
        "JobTenure": 3,
        "AnnualIncome": 850000,
        "MonthlyDebtPayments": 15000,
        "TotalLiabilities": 50000,
        "SavingsAccountBalance": 200000,
        "NetWorth": 500000,
        "CreditCardUtilizationRate": 0.35,  <-- User enters "35%" (Crucial for Score)
        "NumberOfOpenCreditLines": 4,       <-- Crucial for Score
        "NumberOfCreditInquiries": 1,       <-- Crucial for Score
        "PaymentHistory": 55,               <-- Crucial for Score (0-60)
        "LengthOfCreditHistory": 4,         <-- Crucial for Score
        "BankruptcyHistory": 0,
        "PreviousLoanDefaults": 0,
        "LoanAmount": 1000000,
        "LoanDuration": 36
    }
    """
    try:
        # Pass the data to the Orchestrator in agents.py
        # This function handles the Math, Score Calculation, and Routing
        decision = orchestrate_loan(application)
        
        return decision

    except Exception as e:
        # If something breaks (e.g., bad math), tell the frontend why
        print(f"❌ Error during evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health_check():
    return {
        "status": "Active", 
        "mode": "Manual Entry Mode", 
        "system": "Creditsetu AI Orchestrator"
    }