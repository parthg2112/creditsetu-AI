import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const loanId = parseInt(id);

        const result = await db
            .select()
            .from(loans)
            .where(eq(loans.id, loanId))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Loan not found" },
                { status: 404 }
            );
        }

        const loan = result[0];

        return NextResponse.json({
            id: loan.id,
            healthScore: loan.healthScore,
            status: loan.status,
            remediationPlan: loan.remediationPlan,
            createdAt: loan.createdAt
        });
    } catch (error) {
        console.error("Error fetching loan:", error);
        return NextResponse.json(
            { error: "Failed to fetch loan" },
            { status: 500 }
        );
    }
}
