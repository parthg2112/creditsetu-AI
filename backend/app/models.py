from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class LoanSession(BaseModel):
    session_id: str
    
    # --- THE 3 APPROVAL VARIABLES ---
    annual_income: Optional[float] = None
    monthly_debt: Optional[float] = None
    loan_amount: Optional[float] = None
    
    # --- THE 7 SCORE VARIABLES ---
    payment_history_rating: Optional[int] = Field(None, description="0-60 score")
    credit_utilization: Optional[float] = Field(None, description="0.0-1.0")
    credit_history_years: Optional[int] = None
    open_credit_lines: Optional[int] = None
    recent_inquiries: Optional[int] = None
    bankruptcy_history: Optional[int] = None # 0 or 1
    defaults_history: Optional[int] = None    # 0 or 1

    # --- CONTEXT ---
    chat_history: List[Dict[str, str]] = [] 
    is_complete: bool = False 

class ChatResponse(BaseModel):
    response_text: str
    audio_base64: Optional[str] = None
    chart_data: Optional[Dict[str, Any]] = None 
    report_url: Optional[str] = None