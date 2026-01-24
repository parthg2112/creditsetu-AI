import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { findLoanContext } from '@/db/queries';
import { db } from '@/lib/db';
import { loans } from '@/db/schema';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    const { messages, loanId } = await req.json();
    const latestMessage = messages[messages.length - 1].content;
    const targetLoanId = loanId ? parseInt(loanId) : 1;

    // 1. Generate an embedding for the user's question using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(latestMessage);
    const embedding = embeddingResult.embedding.values;

    // 2. Fetch relevant document snippets from the DB
    const context = await findLoanContext(embedding, targetLoanId);
    const documentContext = context.map((c) => c.content).join('\n\n---\n\n');

    // 3. Fetch the loan audit results (health score, red flags, strengths)
    let auditContext = "";
    try {
        const loanResult = await db
            .select()
            .from(loans)
            .where(eq(loans.id, targetLoanId))
            .limit(1);

        if (loanResult.length > 0) {
            const loan = loanResult[0];
            const plan = loan.remediationPlan as any;

            auditContext = `
CURRENT AUDIT RESULTS:
- Health Score: ${loan.healthScore || 'Not available'}/100
- Loan Status: ${loan.status}

${plan?.red_flags?.length > 0 ? `RED FLAGS IDENTIFIED:\n${plan.red_flags.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}` : ''}

${plan?.strengths?.length > 0 ? `STRENGTHS IDENTIFIED:\n${plan.strengths.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}` : ''}

${plan?.summary ? `SUMMARY: ${plan.summary}` : ''}

${plan?.recommended_actions?.length > 0 ? `RECOMMENDED ACTIONS:\n${plan.recommended_actions.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}` : ''}
`;
        }
    } catch (e) {
        console.error("Error fetching loan audit:", e);
    }

    // 4. Stream the response with Gemini and the "Golden Prompt"
    const result = streamText({
        model: google('gemini-2.0-flash-exp'),
        system: `You are the CreditSetu AI Underwriter (formerly LendReady) - a specialized MSME loan readiness advisor.

SYSTEM IDENTITY:
You are a Senior Credit Underwriter with 20 years of experience in MSME lending at major Indian banks. You are helpful, objective, and conservative. You speak in a professional but friendly tone, like a trusted financial advisor.

${auditContext}

RELEVANT DOCUMENT EXCERPTS:
${documentContext || "No document context available. Please remind the user to upload their financial documents."}

CORE GUIDELINES:

1. **Analyze, Don't Guess**: Only use facts from the provided context. If a bank statement shows specific numbers, quote them. If you see bounced checks or high EMIs, mention them specifically.

2. **The 'Path to Yes'**: Never just say "You are rejected." Instead, always provide actionable steps:
   - BAD: "Your DTI is too high, you won't get approved."
   - GOOD: "Your current DTI of 60% is above the typical 40% threshold. To improve this, you could: (1) Close the ₹3,000/month personal loan, or (2) Show additional income sources."

3. **Be Specific with Numbers**: When explaining issues, use actual figures from their documents:
   - "Your bank statement shows 3 existing EMIs totaling ₹25,000/month against a salary of ₹42,000, giving you a DTI of 60%."

4. **Terminology**: Use standard banking terms like DTI (Debt-to-Income), DSR (Debt Service Ratio), CIBIL Score, EMI, but explain them naturally when first mentioned.

5. **Constraints**: If context is missing, be honest:
   - "I don't have visibility into your ITR filings yet. Once uploaded, I can assess your full income picture."

6. **Format Responses**: Use bullet points, numbered lists, or short paragraphs. Keep responses scannable and actionable.

FORMAT:
- Use **bold** for key terms and numbers
- Use bullet points for lists
- Keep explanations under 3-4 sentences per point
- Always end with a clear next step or offer to help further`,
        messages,
    });

    return result.toTextStreamResponse();
}
