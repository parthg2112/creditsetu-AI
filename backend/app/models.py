
# backend/app/models.py
from pydantic import BaseModel, Field
from typing import Optional, List

class LoanApplicationSchema(BaseModel):
    """
    Data Schema matching the 'Financial Risk for Loan Approval' dataset.
    The RAG system will map PDF data to these fields.
    """
    # --- Demographics ---
    Age: int = Field(..., description="Applicant's age")
    EducationLevel: str = Field(..., description="High School, Bachelor, Master, Doctorate, Associate")
    EmploymentStatus: str = Field(..., description="Employed, Self-Employed, Unemployed")
    JobTenure: int = Field(..., description="Years in current job")
    MaritalStatus: str = Field(..., description="Single, Married, Divorced, Widowed")

    # --- Financials ---
    AnnualIncome: float
    MonthlyIncome: float
    NetWorth: float = Field(..., description="Total Assets - Total Liabilities")
    SavingsAccountBalance: float
    CheckingAccountBalance: float
    TotalAssets: float
    TotalLiabilities: float
    
    # --- Credit Profile (The "Smart" Columns) ---
    CreditScore: int = Field(..., ge=300, le=850)
    CreditCardUtilizationRate: float = Field(..., description="0.0 to 1.0 (e.g. 0.30 is 30%)")
    NumberOfOpenCreditLines: int
    NumberOfCreditInquiries: int
    DebtToIncomeRatio: float = Field(..., description="Monthly Debt / Monthly Income")
    PaymentHistory: int = Field(..., description="Score 0-60 representing payment reliability")
    LengthOfCreditHistory: int = Field(..., description="Years of credit history")
    BankruptcyHistory: int = Field(0, description="1 if history exists, 0 otherwise")
    PreviousLoanDefaults: int = Field(0, description="1 if yes, 0 if no")
    
    # --- The Loan Request ---
    LoanAmount: float
    LoanDuration: int = Field(..., description="Duration in months")
    LoanPurpose: str
    
    # --- Alternative Data ---
    UtilityBillsPaymentHistory: float = Field(0.5, description="0.0 to 1.0 reliability score")

class AgentResponse(BaseModel):
    """
    Standard response format for the Orchestrator.
    """
    decision: str  # "APPROVED", "REJECTED", "REFERRED"
    risk_score: float
    routing_reason: str
    agent_name: Optional[str] = None
    improvement_plan: List[str] = []