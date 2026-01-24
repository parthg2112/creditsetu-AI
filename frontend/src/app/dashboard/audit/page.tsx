"use client";

import { ScoreGauge } from "@/components/dashboard/audit/score-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, IndianRupee, PieChart, ShieldCheck, ArrowRight, BadgeCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AuditPage() {
    const RED_FLAGS = [
        {
            id: 1,
            title: "High frequency of cheque bounces",
            description: "Found 4 inward return instances in October statement.",
            severity: "critical"
        },
        {
            id: 2,
            title: "Unidentified large cash deposits",
            description: "3 transactions over ₹50k lack clear source descriptors.",
            severity: "warning"
        }
    ];

    return (
        <div className="pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Summary Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 shadow-sm dark:from-slate-900 dark:to-slate-800 dark:border-slate-800">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <PieChart className="h-48 w-48 text-primary" />
                </div>

                <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="shrink-0 scale-110">
                        <ScoreGauge score={64} title="Loan Readiness Score" />
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
                            Rahul, your profile shows potential, but <span className="text-red-600">3 critical red flags</span> might trigger a rejection right now.
                        </h1>
                        <p className="text-muted-foreground max-w-xl mx-auto md:mx-0">
                            Our AI has analyzed your bank statements and found gaps that lenders typically flag. Fixing these can boost your approval chances by 40%.
                        </p>
                        <div className="pt-2">
                            <Button className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                                View Detailed Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Card 1 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Avg Balance</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹45,200</div>
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                            <BadgeCheck className="mr-1 h-3 w-3" /> Healthy
                        </Badge>
                    </CardContent>
                </Card>

                {/* Card 2 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Debt-to-Income Ratio</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">58%</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <AlertCircle className="mr-1 h-3 w-3" /> High Risk
                            </Badge>
                            <span className="text-xs text-muted-foreground">Banks prefer &lt;40%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 3 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">KYC Status</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Verified</div>
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                            <BadgeCheck className="mr-1 h-3 w-3" /> Success
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Red Flags Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Critical Issues Detected by AI
                </h3>

                <div className="grid gap-4">
                    {RED_FLAGS.map((flag) => (
                        <Card key={flag.id} className="border-l-4 border-l-red-500 shadow-sm transition-all hover:shadow-md">
                            <CardContent className="flex items-start gap-4 p-6">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{flag.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {flag.description}
                                    </p>
                                </div>
                                <Button variant="ghost" className="ml-auto text-primary shrink-0">
                                    Fix this
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Primary CTA */}
            <div className="flex justify-center pt-8">
                <Button size="lg" className="h-14 rounded-full px-8 text-lg font-bold shadow-xl shadow-primary/20 group animate-pulse hover:animate-none">
                    View My Remediation Plan & Improve Score
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>

        </div>
    );
}
