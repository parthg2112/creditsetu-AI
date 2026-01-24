import { sql, desc, gt, cosineDistance, eq, and } from 'drizzle-orm';
import { documentEmbeddings, documents } from './schema';
import { db } from '@/lib/db';

export const findLoanContext = async (
    queryEmbedding: number[],
    loanId: number,
    limit = 5
) => {
    // Similarity = 1 - Cosine Distance
    const similarity = sql<number>`1 - (${cosineDistance(documentEmbeddings.embedding, queryEmbedding)})`;

    return await db
        .select({
            content: documentEmbeddings.content,
            metadata: documentEmbeddings.metadata,
            similarity,
        })
        .from(documentEmbeddings)
        .innerJoin(documents, eq(documentEmbeddings.documentId, documents.id))
        .where(
            // Filter: Correct Loan + Document Status is 'completed' + Similarity Threshold
            and(
                eq(documents.loanId, loanId),
                eq(documents.status, 'completed'),
                gt(similarity, 0.5)
            )
        )
        .orderBy(desc(similarity))
        .limit(limit);
};
