from typing import List
from .models import LoanApplicationSchema, AgentResponse

# --- 1. THE "SHADOW SCORING" ENGINE ---
def calculate_heuristic_score(user: LoanApplicationSchema) -> int:
    """
    Calculates a synthetic credit score (300-900) based on FICO-like weights.
    """
    score = 300  # Baseline
    
    # Factor 1: Payment History (35%) - Max 210 pts
    # User inputs 0-60. We scale to 210.
    score += (user.PaymentHistory / 60) * 210
    
    # Factor 2: Credit Utilization (30%) - Max 180 pts
    # Lower is better. 
    if user.CreditCardUtilizationRate <= 0.10:
        score += 180
    elif user.CreditCardUtilizationRate >= 1.0:
        score += 0
    else:
        # Linear decay: 0.10 -> 180, 1.0 -> 0
        score += 180 * (1.0 - user.CreditCardUtilizationRate)
        
    # Factor 3: History Length (15%) - Max 90 pts
    # Cap at 10 years
    score += min(user.LengthOfCreditHistory, 10) * 9
    
    # Factor 4: Credit Mix (10%) - Max 60 pts
    if user.NumberOfOpenCreditLines >= 5:
        score += 60
    elif user.NumberOfOpenCreditLines >= 2:
        score += 40
    else:
        score += 20
        
    # Factor 5: New Credit (10%) - Max 60 pts
    if user.NumberOfCreditInquiries == 0:
        score += 60
    elif user.NumberOfCreditInquiries <= 2:
        score += 40
    else:
        score += 20
        
    # Penalties
    if user.BankruptcyHistory == 1:
        score -= 150
    if user.PreviousLoanDefaults == 1:
        score -= 100
        
    return int(max(300, min(900, score)))

# --- 2. THE SPECIALIST AGENTS ---

def run_credit_improver_agent(user: LoanApplicationSchema, current_score: int) -> AgentResponse:
    plan = []
    
    # Utilization Advice
    if user.CreditCardUtilizationRate > 0.30:
        target_util = 0.30
        estimated_limit = user.TotalLiabilities * 1.5 
        current_balance = estimated_limit * user.CreditCardUtilizationRate
        target_balance = estimated_limit * target_util
        pay_down_amount = current_balance - target_balance
        
        plan.append(f"CRITICAL: High Credit Utilization ({user.CreditCardUtilizationRate*100:.0f}%).")
        plan.append(f"Action: Pay down approx. ${pay_down_amount:.0f} to reach 30% utilization.")
        plan.append(f"Impact: This can boost your score by 40-60 points.")

    # Payment History Advice
    if user.PaymentHistory < 50: 
        plan.append("WARNING: Inconsistent payment history.")
        plan.append("Action: Activate Auto-Pay for minimum due on ALL accounts.")
        plan.append("Action: Avoid new credit applications for 6 months.")

    # Mix Advice
    if user.NumberOfOpenCreditLines < 3:
        plan.append("Observation: Thin credit file.")
        plan.append("Action: Open a 'Secured Credit Card' to build history.")

    return AgentResponse(
        decision="REFERRED",
        risk_score=80, # High risk
        calculated_credit_score=current_score,
        routing_reason=f"Credit Score ({current_score}) is too low.",
        agent_name="Credit Score Improver Agent",
        improvement_plan=plan
    )

def run_debt_optimizer_agent(user: LoanApplicationSchema, dti: float, score: int) -> AgentResponse:
    plan = []
    max_dti = 0.45
    monthly_income = user.AnnualIncome / 12
    excess_payment = user.MonthlyDebtPayments - (monthly_income * max_dti)
    
    plan.append(f"Status: DTI is {dti:.2f} (Limit: {max_dti}).")
    
    if excess_payment > 0:
        plan.append(f"Goal: Reduce monthly debt payments by ${excess_payment:.0f}.")
        plan.append("Strategy: Consolidate high-interest loans into a single 5-year term loan.")
    
    return AgentResponse(
        decision="REFERRED",
        risk_score=70,
        calculated_credit_score=score,
        routing_reason="High Debt-to-Income Ratio.",
        agent_name="Debt Optimization Agent",
        improvement_plan=plan
    )

def run_income_stability_agent(user: LoanApplicationSchema, score: int) -> AgentResponse:
    plan = []
    target_reserves = user.LoanAmount * 0.10
    shortfall = target_reserves - user.SavingsAccountBalance
    
    plan.append(f"Insight: Self-employed applicants need 10% of loan amount in reserves.")
    if shortfall > 0:
        plan.append(f"Action: Increase savings by ${shortfall:.0f}.")
    plan.append("Action: Prepare 2 years of audited ITR/Bank Statements.")
        
    return AgentResponse(
        decision="REFERRED",
        risk_score=60,
        calculated_credit_score=score,
        routing_reason="Income Stability Check Required.",
        agent_name="Income Stability Advisor",
        improvement_plan=plan
    )

# --- 3. THE ORCHESTRATOR ---
def orchestrate_loan(user: LoanApplicationSchema) -> AgentResponse:
    # 1. Calculate Score
    credit_score = calculate_heuristic_score(user)
    
    # 2. Calculate DTI
    monthly_income = user.AnnualIncome / 12
    dti_ratio = user.MonthlyDebtPayments / monthly_income if monthly_income > 0 else 1.0

    # 3. Hard Stop
    if user.BankruptcyHistory == 1:
        return AgentResponse(
            decision="REJECTED",
            risk_score=95,
            calculated_credit_score=credit_score,
            routing_reason="Bankruptcy Record Found",
            agent_name="Legal Advisor",
            improvement_plan=["Wait 2 years post-discharge."]
        )

    # 4. Route to Credit Improver
    if credit_score < 680 or user.CreditCardUtilizationRate > 0.40:
        return run_credit_improver_agent(user, credit_score)

    # 5. Route to Debt Optimizer
    if dti_ratio > 0.45:
        return run_debt_optimizer_agent(user, dti_ratio, credit_score)

    # 6. Route to Income Stability
    if user.EmploymentStatus == "Self-Employed" and user.NetWorth < (user.LoanAmount * 0.2):
        return run_income_stability_agent(user, credit_score)

    # 7. Approval
    return AgentResponse(
        decision="APPROVED",
        risk_score=10,
        calculated_credit_score=credit_score,
        routing_reason="Excellent Profile.",
        agent_name=None,
        improvement_plan=[]
    )