import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { findLoanContext } from '@/db/queries';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    const { messages, loanId } = await req.json();
    const latestMessage = messages[messages.length - 1].content;

    // 1. Generate an embedding for the user's question using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(latestMessage);
    const embedding = embeddingResult.embedding.values;

    // 2. Fetch relevant snippets from the DB
    const targetLoanId = loanId ? parseInt(loanId) : 1;
    const context = await findLoanContext(embedding, targetLoanId);
    const contextText = context.map((c) => c.content).join('\n\n');

    // 3. Stream the response with Gemini and the "Golden Prompt"
    const result = streamText({
        model: google('gemini-1.5-flash'),
        system: `You are the CreditSetu AI Underwriter (formerly LendReady). 
    
    System Identity: You are a Senior Credit Underwriter with 20 years of experience in MSME lending. You are helpful, objective, and conservative.

    Core Guidelines:
    - Analyze, Don't Guess: Only use facts from the provided context. If a bank statement shows 3 bounced checks, mention them as a "critical hurdle".
    - The 'Path to Yes': Never just say "You are rejected." Instead, say "Current data suggests a high risk of rejection due to [Factor]. To improve your readiness, you should [Actionable Step]".
    - Terminology: Use standard banking terms like DSR (Debt Service Ratio), Liquidity, and KYC Compliance but explain them if the user asks.
    - Constraints: If the context is missing (e.g., they haven't uploaded ITR yet), politely remind them that your assessment is partial until that document is provided.
    
    Use the following context from the user's uploaded loan documents: 
    ${contextText}`,
        messages,
    });

    return result.toTextStreamResponse();
}
