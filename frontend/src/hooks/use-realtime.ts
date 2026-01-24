"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// Create a browser client for realtime subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DocumentStatus {
    id: number;
    status: string;
    loan_id?: number;
}

interface UseDocumentRealtimeOptions {
    documentId?: number;
    loanId?: number;
    onStatusChange?: (status: string, documentId: number) => void;
    onComplete?: (documentId: number) => void;
}

/**
 * Hook to subscribe to real-time document status updates via Supabase Realtime.
 * 
 * Usage:
 * const { isComplete, currentStatus } = useDocumentRealtime({
 *   documentId: 4,
 *   onComplete: (docId) => router.push('/dashboard/audit')
 * });
 */
export function useDocumentRealtime({
    documentId,
    loanId,
    onStatusChange,
    onComplete,
}: UseDocumentRealtimeOptions) {
    const [currentStatus, setCurrentStatus] = useState<string>("pending");
    const [isComplete, setIsComplete] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!documentId && !loanId) return;

        // Build the filter
        const filter = documentId
            ? `id=eq.${documentId}`
            : `loan_id=eq.${loanId}`;

        console.log(`📡 Subscribing to document updates: ${filter}`);

        const channel = supabase
            .channel(`document-status-${documentId || loanId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "documents",
                    filter,
                },
                (payload) => {
                    const newStatus = payload.new.status as string;
                    const docId = payload.new.id as number;

                    console.log(`📡 Document ${docId} status changed: ${newStatus}`);

                    setCurrentStatus(newStatus);
                    setIsProcessing(newStatus === "processing");

                    if (onStatusChange) {
                        onStatusChange(newStatus, docId);
                    }

                    if (newStatus === "completed") {
                        setIsComplete(true);
                        if (onComplete) {
                            onComplete(docId);
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log(`📡 Realtime subscription status: ${status}`);
            });

        // Cleanup on unmount
        return () => {
            console.log("📡 Unsubscribing from document updates");
            supabase.removeChannel(channel);
        };
    }, [documentId, loanId, onStatusChange, onComplete]);

    return {
        currentStatus,
        isComplete,
        isProcessing,
    };
}

interface UseLoanRealtimeOptions {
    loanId: number;
    onUpdate?: (loan: any) => void;
    onAuditComplete?: (healthScore: string, loan: any) => void;
}

/**
 * Hook to subscribe to real-time loan updates (health score, remediation plan).
 */
export function useLoanRealtime({
    loanId,
    onUpdate,
    onAuditComplete,
}: UseLoanRealtimeOptions) {
    const [loan, setLoan] = useState<any>(null);
    const [healthScore, setHealthScore] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!loanId) return;

        console.log(`📡 Subscribing to loan updates: loan_id=${loanId}`);

        const channel = supabase
            .channel(`loan-status-${loanId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "loans",
                    filter: `id=eq.${loanId}`,
                },
                (payload) => {
                    const newLoan = payload.new;
                    console.log(`📡 Loan ${loanId} updated:`, newLoan);

                    setLoan(newLoan);

                    if (newLoan.health_score) {
                        setHealthScore(newLoan.health_score);
                    }

                    if (newLoan.status === "ready") {
                        setIsReady(true);
                        if (onAuditComplete) {
                            onAuditComplete(newLoan.health_score, newLoan);
                        }
                    }

                    if (onUpdate) {
                        onUpdate(newLoan);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loanId, onUpdate, onAuditComplete]);

    return {
        loan,
        healthScore,
        isReady,
    };
}
