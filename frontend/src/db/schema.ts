import { pgTable, serial, text, timestamp, vector, jsonb } from "drizzle-orm/pg-core";

export const loans = pgTable("loans", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    status: text("status").default("pending"), // pending, auditing, ready
    healthScore: text("health_score"),
    remediationPlan: jsonb("remediation_plan"), // JSON from Python Brain
    createdAt: timestamp("created_at").defaultNow(),
});

export const documentEmbeddings = pgTable("document_embeddings", {
    id: serial("id").primaryKey(),
    loanId: serial("loan_id").references(() => loans.id),
    content: text("content"),
    embedding: vector("embedding", { dimensions: 1536 }), // OpenAI standard
    metadata: jsonb("metadata"),
});
