"use client";

import { Info, Warning, CheckCircle, Lightbulb } from "@phosphor-icons/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActionPlanProps {
    redFlags?: string[];
    strengths?: string[];
    recommendedActions?: string[];
    summary?: string;
}

export function ActionPlan({ redFlags, strengths, recommendedActions, summary }: ActionPlanProps) {
    // Default/fallback data if not provided
    const defaultActions = [
        {
            id: "item-1",
            title: "Reduce DTI Ratio by 15%",
            impact: "High Impact",
            impactColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
            content: "Your current existing loan EMIs are eating up too much revenue. Action: Consider closing the small 'Consumer Durable Loan' (₹12k remaining) before applying for the big business loan."
        },
        {
            id: "item-2",
            title: "Explain Cash Deposits",
            impact: "Medium Impact",
            impactColor: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
            content: "Prepare invoices or vouchers for the ₹50k deposits on Oct 12th and Nov 5th. The banker will ask for this to rule out money laundering signs."
        },
        {
            id: "item-3",
            title: "Update GST Filing Address",
            impact: "Low Impact",
            impactColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
            content: "Your business address in GST filings slightly mismatches your bank record. File a quick amendment."
        }
    ];

    // Build actions from recommended_actions if available
    const actions = recommendedActions && recommendedActions.length > 0
        ? recommendedActions.map((action, index) => ({
            id: `item-${index}`,
            title: action,
            impact: index === 0 ? "High Impact" : index === 1 ? "Medium Impact" : "Low Impact",
            impactColor: index === 0
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                : index === 1
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
            content: `This action was identified by our AI auditor as a key step to improve your loan readiness.`
        }))
        : defaultActions;

    return (
        <div className="space-y-6">
            {/* Summary Banner */}
            {summary && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">{summary}</p>
                    </CardContent>
                </Card>
            )}

            {/* Red Flags & Strengths Side by Side */}
            {(redFlags?.length || strengths?.length) && (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Red Flags */}
                    {redFlags && redFlags.length > 0 && (
                        <Card className="border-red-200 dark:border-red-900">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <Warning className="h-4 w-4" />
                                    Red Flags ({redFlags.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-2">
                                    {redFlags.map((flag, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Strengths */}
                    {strengths && strengths.length > 0 && (
                        <Card className="border-green-200 dark:border-green-900">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    Strengths ({strengths.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-2">
                                    {strengths.map((strength, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Action Items */}
            <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Your Path to Approval (Target Score: 80+)
                </h2>
                <p className="text-muted-foreground">
                    Complete these prioritized actions to boost your loan limit.
                </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {actions.map((action) => (
                    <AccordionItem key={action.id} value={action.id} className="border border-border/60 rounded-xl bg-white dark:bg-slate-900 shadow-sm px-2">
                        <AccordionTrigger className="hover:no-underline px-4 py-3">
                            <div className="flex items-center gap-4 text-left">
                                <Badge variant="outline" className={cn("border-0 font-medium", action.impactColor)}>
                                    {action.impact}
                                </Badge>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-lg">
                                    {action.title}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-4 text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800 flex gap-3">
                                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                {action.content}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
