"use server";

import { db } from "@/lib/db";
import { loans, documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createDocumentRecord(
    userId: string,
    fileName: string,
    filePath: string,
    fileSize: number
) {
    try {
        // 1. Get or Create Loan Record
        let loanId: number;

        const existingLoans = await db
            .select()
            .from(loans)
            .where(eq(loans.userId, userId))
            .limit(1);

        if (existingLoans.length > 0) {
            loanId = existingLoans[0].id;
        } else {
            const [newLoan] = await db
                .insert(loans)
                .values({
                    userId: userId,
                    status: "auditing",
                })
                .returning();
            loanId = newLoan.id;
        }

        // 2. Insert into Documents Table (Status: Processing)
        const [newDoc] = await db.insert(documents).values({
            loanId: loanId,
            name: fileName,
            storagePath: filePath,
            status: "processing"
        }).returning();

        // 3. Trigger Python Backend
        try {
            const pythonApiUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

            // Fire and forget or await? For now await to ensure connectivity
            await fetch(`${pythonApiUrl}/api/python/audit-loan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    loan_id: loanId,
                    document_id: newDoc.id,
                    storage_path: filePath,
                }),
            });
        } catch (apiError) {
            console.error("Failed to trigger Python backend:", apiError);
            // Ensure we don't block the UI if backend is down, but log it.
        }

        return { success: true, loanId, documentId: newDoc.id };

    } catch (error) {
        console.error("Error creating document record:", error);
        return { success: false, error: "Database update failed" };
    }
}
