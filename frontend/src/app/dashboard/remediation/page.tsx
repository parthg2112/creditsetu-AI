"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ActionPlan } from "@/components/dashboard/remediation/action-plan";
import { ChatSidebar } from "@/components/dashboard/remediation/chat-sidebar";
import { useLoanRealtime } from "@/hooks/use-realtime";

interface LoanData {
    id: number;
    healthScore: string | null;
    status: string;
    remediationPlan: {
        red_flags?: string[];
        strengths?: string[];
        summary?: string;
        recommended_actions?: string[];
    } | null;
}

export default function RemediationPage() {
    const [loanId] = useState(1); // MVP: Using default loan ID
    const [loanData, setLoanData] = useState<LoanData | null>(null);
    const [loading, setLoading] = useState(true);

    // Subscribe to real-time updates for the loan
    const { loan: realtimeLoan, healthScore: realtimeScore } = useLoanRealtime({
        loanId,
        onUpdate: (updatedLoan) => {
            console.log("📡 Loan updated via Realtime:", updatedLoan);
            setLoanData(updatedLoan);
        }
    });

    // Initial data fetch
    useEffect(() => {
        async function fetchLoanData() {
            try {
                const res = await fetch(`/api/loan/${loanId}`);
                if (res.ok) {
                    const data = await res.json();
                    setLoanData(data);
                }
            } catch (e) {
                console.error("Error fetching loan data:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchLoanData();
    }, [loanId]);

    // Use realtime data if available
    const currentLoan = realtimeLoan || loanData;
    const currentScore = realtimeScore || currentLoan?.healthScore || "64";

    return (
        <div className="grid gap-8 lg:grid-cols-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Panel: Action Plan (70% -> 7 cols) */}
            <div className="lg:col-span-7">
                <ActionPlan
                    redFlags={currentLoan?.remediationPlan?.red_flags}
                    strengths={currentLoan?.remediationPlan?.strengths}
                    recommendedActions={currentLoan?.remediationPlan?.recommended_actions}
                    summary={currentLoan?.remediationPlan?.summary}
                />
            </div>

            {/* Right Panel: AI Chat Sidebar (30% -> 3 cols) */}
            <div className="lg:col-span-3">
                <div className="sticky top-24">
                    <ChatSidebar
                        loanId={loanId}
                        healthScore={currentScore}
                    />
                </div>
            </div>
        </div>
    );
}
