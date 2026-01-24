# backend/app/agents.py
from .models import LoanApplicationSchema, AgentResponse

def orchestrate_loan(user: LoanApplicationSchema) -> AgentResponse:
    """
    Analyzes the LoanApplicationSchema and routes it to the correct Agent or Approval.
    """
    reasons = []
    
    # --- 1. Hard Fails (Knockout Rules) ---
    if user.BankruptcyHistory == 1:
        return AgentResponse(
            decision="REJECTED",
            risk_score=95.0,
            routing_reason="Bankruptcy Record Found",
            agent_name="Legal Settlement Advisor",
            improvement_plan=[
                "Wait minimum 2 years post-discharge before reapplying.",
                "Consult a credit repair specialist to remove outdated remarks."
            ]
        )

    # --- 2. Credit Score Improver Logic ---
    # Trigger: Low Score OR High Utilization OR Missed Payments
    if user.CreditScore < 680 or user.CreditCardUtilizationRate > 0.40 or user.PaymentHistory < 20:
        
        # specific advice generation
        plan = []
        if user.CreditCardUtilizationRate > 0.30:
            target_util = 0.30
            # Calculate exact amount to pay down
            # Assuming TotalLiabilities roughly correlates to credit debt for this calculation
            estimated_credit_debt = user.TotalLiabilities * user.CreditCardUtilizationRate
            pay_down = estimated_credit_debt * (user.CreditCardUtilizationRate - target_util)
            plan.append(f"High Utilization detected ({user.CreditCardUtilizationRate*100:.0f}%). Pay down approx. ${pay_down:.0f} to reach 30%.")
            
        if user.PaymentHistory < 20:
             plan.append("Payment reliability is low. Automate minimum payments for the next 6 months.")

        if not plan:
            plan.append("Generic credit builder plan: Open a secured credit card.")

        return AgentResponse(
            decision="REFERRED",
            risk_score=75.0,
            routing_reason="Credit Profile Needs Optimization",
            agent_name="Credit Score Improver",
            improvement_plan=plan
        )

    # --- 3. Debt Optimization Logic ---
    # Trigger: High DTI
    if user.DebtToIncomeRatio > 0.45:
        return AgentResponse(
            decision="REFERRED",
            risk_score=70.0,
            routing_reason="High Debt-to-Income Ratio",
            agent_name="Debt Optimization Agent",
            improvement_plan=[
                f"Your DTI is {user.DebtToIncomeRatio:.2f}. Limit is 0.45.",
                "Consolidate multiple loans into a single long-term loan.",
                "Avoid new EMI obligations for 12 months."
            ]
        )

    # --- 4. Income & Asset Logic ---
    # Trigger: Self-Employed with low reserves
    if user.EmploymentStatus == "Self-Employed" and user.NetWorth < user.LoanAmount * 0.2:
        return AgentResponse(
            decision="REFERRED",
            risk_score=60.0,
            routing_reason="Insufficient Reserves for Self-Employed Applicant",
            agent_name="Income Stability Advisor",
            improvement_plan=[
                f"Increase Net Worth to 20% of loan value (Target: ${user.LoanAmount * 0.2:.0f}).",
                "Provide audited financial statements for the last 2 years."
            ]
        )

    # --- 5. Approval (Success Case) ---
    return AgentResponse(
        decision="APPROVED",
        risk_score=10.0,
        routing_reason="Profile meets all underwriting criteria.",
        agent_name=None,
        improvement_plan=[]
    )