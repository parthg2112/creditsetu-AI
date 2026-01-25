"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ScoreGauge } from "@/components/dashboard/audit/score-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, IndianRupee, PieChart, ShieldCheck, ArrowRight, BadgeCheck, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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

export default function AuditPage() {
    const [loanId] = useState(1);
    const [loanData, setLoanData] = useState<LoanData | null>(null);
    const [loading, setLoading] = useState(true);

    // Subscribe to realtime updates
    const { loan: realtimeLoan, healthScore: realtimeScore } = useLoanRealtime({
        loanId,
        onUpdate: (updatedLoan) => {
            console.log("📡 Loan updated:", updatedLoan);
            setLoanData({
                id: updatedLoan.id,
                healthScore: updatedLoan.health_score,
                status: updatedLoan.status,
                remediationPlan: updatedLoan.remediation_plan
            });
        }
    });

    // Fetch initial data
    useEffect(() => {
        async function fetchLoan() {
            try {
                // Add cache busting to ensure fresh data
                const res = await fetch(`/api/loan/${loanId}?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = await res.json();
                    setLoanData(data);
                }
            } catch (e) {
                console.error("Error fetching loan:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchLoan();
    }, [loanId]);

    const currentScore = parseInt(realtimeScore || loanData?.healthScore || "0");
    const plan = loanData?.remediationPlan;
    const redFlags = plan?.red_flags || [];
    const strengths = plan?.strengths || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading your audit results...</p>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        if (score >= 40) return "text-orange-600";
        return "text-red-600";
    };

    const getScoreMessage = (score: number) => {
        if (score >= 80) return "Strong candidate, likely approval";
        if (score >= 60) return "Moderate risk, may need conditions";
        if (score >= 40) return "High risk, significant concerns";
        return "Very high risk, needs improvement";
    };

    return (
        <div className="pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Summary Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 shadow-sm dark:from-slate-900 dark:to-slate-800 dark:border-slate-800">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <PieChart className="h-48 w-48 text-primary" />
                </div>

                <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="shrink-0 scale-110">
                        <ScoreGauge score={currentScore} title="Loan Readiness Score" />
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
                            Your Health Score is <span className={getScoreColor(currentScore)}>{currentScore}/100</span>
                            {redFlags.length > 0 && (
                                <span className="text-red-600"> with {redFlags.length} red flag{redFlags.length > 1 ? 's' : ''}</span>
                            )}
                        </h1>
                        <p className="text-muted-foreground max-w-xl mx-auto md:mx-0">
                            {plan?.summary || getScoreMessage(currentScore)}
                        </p>
                        <div className="pt-2">
                            <Link href="/dashboard/remediation">
                                <Button className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                                    View Remediation Plan
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Strengths Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Strengths Found</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{strengths.length}</div>
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                            <BadgeCheck className="mr-1 h-3 w-3" /> Positive Indicators
                        </Badge>
                    </CardContent>
                </Card>

                {/* Red Flags Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Red Flags</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${redFlags.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {redFlags.length}
                        </div>
                        <Badge
                            variant="outline"
                            className={redFlags.length > 0
                                ? "mt-2 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                                : "mt-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                            }
                        >
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {redFlags.length > 0 ? 'Needs Attention' : 'All Clear'}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Health Score Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overall Health</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>{currentScore}%</div>
                        <Badge
                            variant="outline"
                            className={`mt-2 ${currentScore >= 70
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
                                : currentScore >= 50
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400"
                                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400"
                                }`}
                        >
                            <PieChart className="mr-1 h-3 w-3" />
                            {currentScore >= 70 ? 'Good' : currentScore >= 50 ? 'Fair' : 'Needs Work'}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Red Flags Section */}
            {redFlags.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Issues Detected by AI
                    </h3>

                    <div className="grid gap-4">
                        {redFlags.map((flag, idx) => (
                            <Card key={idx} className="border-l-4 border-l-red-500 shadow-sm transition-all hover:shadow-md">
                                <CardContent className="flex items-start gap-4 p-6">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            Issue #{idx + 1}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">{flag}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Strengths Section */}
            {strengths.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Strengths Identified
                    </h3>

                    <div className="grid gap-4">
                        {strengths.map((strength, idx) => (
                            <Card key={idx} className="border-l-4 border-l-green-500 shadow-sm transition-all hover:shadow-md">
                                <CardContent className="flex items-start gap-4 p-6">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{strength}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Primary CTA */}
            <div className="flex justify-center pt-8">
                <Link href="/dashboard/remediation">
                    <Button size="lg" className="h-14 rounded-full px-8 text-lg font-bold shadow-xl shadow-primary/20 group">
                        View My Remediation Plan & Improve Score
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
