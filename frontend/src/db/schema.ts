import { pgTable, serial, text, timestamp, vector, jsonb, integer } from "drizzle-orm/pg-core";

export const loans = pgTable("loans", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    status: text("status").default("pending"), // pending, auditing, ready
    healthScore: text("health_score"),
    remediationPlan: jsonb("remediation_plan"), // JSON from Python Brain
    createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
    id: serial("id").primaryKey(),
    loanId: integer("loan_id").references(() => loans.id),
    name: text("name").notNull(),
    storagePath: text("storage_path").notNull(),
    status: text("status").default("uploading"), // uploading, processing, completed, failed
    createdAt: timestamp("created_at").defaultNow(),
});

export const documentEmbeddings = pgTable("document_embeddings", {
    id: serial("id").primaryKey(),
    documentId: integer("document_id").references(() => documents.id),
    content: text("content"),
    embedding: vector("embedding", { dimensions: 768 }), // Gemini text-embedding-004
    metadata: jsonb("metadata"),
});
