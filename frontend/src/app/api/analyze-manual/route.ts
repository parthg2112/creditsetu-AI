import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans } from "@/db/schema";
import { eq } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface ManualParams {
    monthlyIncome: string;
    existingEMIs: string;
    loanAmountRequested: string;
    loanTenure: string;
    businessVintage: string;
    annualTurnover: string;
    creditScore: string;
    avgBankBalance: string;
    gstCompliance: string;
    existingLoans: string;
    propertyOwnership: string;
    industryType: string;
}

export async function POST(req: Request) {
    try {
        const { params, loanId } = await req.json() as { params: ManualParams; loanId: number };

        // Calculate DTI (Debt-to-Income Ratio)
        const monthlyIncome = parseFloat(params.monthlyIncome) || 0;
        const existingEMIs = parseFloat(params.existingEMIs) || 0;
        const dti = monthlyIncome > 0 ? (existingEMIs / monthlyIncome) * 100 : 0;

        // Create context for Gemini
        const contextText = `
LOAN APPLICATION PARAMETERS:
- Monthly Income: ₹${params.monthlyIncome}
- Existing EMIs: ₹${params.existingEMIs}/month
- Current DTI Ratio: ${dti.toFixed(1)}%
- Loan Amount Requested: ₹${params.loanAmountRequested}
- Loan Tenure: ${params.loanTenure} months
- Business Vintage: ${params.businessVintage} years
- Annual Turnover: ₹${params.annualTurnover}
- Credit Score (CIBIL): ${params.creditScore}
- Average Bank Balance: ₹${params.avgBankBalance}
- GST Filing Status: ${params.gstCompliance}
- Existing Loans Count: ${params.existingLoans}
- Property Ownership: ${params.propertyOwnership}
- Industry Type: ${params.industryType}
`;

        // Call Gemini for analysis
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are a Senior Credit Underwriter analyzing an MSME loan application.

${contextText}

Analyze these financial parameters and provide a loan readiness assessment.

RESPOND ONLY WITH A VALID JSON OBJECT (no markdown, no explanation):
{
    "health_score": <number 0-100>,
    "red_flags": ["<issue1>", "<issue2>"],
    "strengths": ["<strength1>", "<strength2>"],
    "summary": "<2-3 sentence overall assessment>",
    "recommended_actions": ["<action1>", "<action2>"]
}

Scoring guidelines:
- 80-100: Strong candidate, likely approval
- 60-79: Moderate risk, may need conditions
- 40-59: High risk, significant concerns
- 0-39: Very high risk, likely rejection

Consider:
- DTI ratio (ideal <40%, concerning >50%)
- Credit score (excellent >750, good 700-750, fair 650-700, poor <650)
- Business vintage (more years = better)
- GST compliance (regular filing = good)
- Average bank balance vs EMI obligations`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Clean up response
        if (responseText.startsWith("```")) {
            responseText = responseText.split("```")[1];
            if (responseText.startsWith("json")) {
                responseText = responseText.substring(4);
            }
        }
        responseText = responseText.trim();

        const auditResult = JSON.parse(responseText);

        // Update the loan in database
        const loanUpdate = {
            healthScore: String(auditResult.health_score || 0),
            status: "ready" as const,
            remediationPlan: {
                red_flags: auditResult.red_flags || [],
                strengths: auditResult.strengths || [],
                summary: auditResult.summary || "",
                recommended_actions: auditResult.recommended_actions || []
            }
        };

        await db.update(loans).set(loanUpdate).where(eq(loans.id, loanId));

        return NextResponse.json({
            success: true,
            healthScore: auditResult.health_score,
            redFlags: auditResult.red_flags,
            strengths: auditResult.strengths,
            summary: auditResult.summary,
            recommendedActions: auditResult.recommended_actions
        });

    } catch (error) {
        console.error("Manual analysis error:", error);
        return NextResponse.json(
            { error: "Analysis failed", details: String(error) },
            { status: 500 }
        );
    }
}
