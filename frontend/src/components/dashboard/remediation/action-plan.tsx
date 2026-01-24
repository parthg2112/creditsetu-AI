"use client";

import { CheckCircle2, Circle, AlertTriangle, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ActionPlan() {
    const actions = [
        {
            id: "item-1",
            title: "Reduce DTI Ratio by 15%",
            impact: "High Impact",
            impactColor: "bg-red-100 text-red-700",
            content: "Your current existing loan EMIs are eating up too much revenue. Action: Consider closing the small 'Consumer Durable Loan' (₹12k remaining) before applying for the big business loan."
        },
        {
            id: "item-2",
            title: "Explain Cash Deposits",
            impact: "Medium Impact",
            impactColor: "bg-orange-100 text-orange-700",
            content: "Prepare invoices or vouchers for the ₹50k deposits on Oct 12th and Nov 5th. The banker will ask for this to rule out money laundering signs."
        },
        {
            id: "item-3",
            title: "Update GST Filing Address",
            impact: "Low Impact",
            impactColor: "bg-blue-100 text-blue-700",
            content: "Your business address in GST filings slightly mismatches your bank record. File a quick amendment."
        }
    ];

    return (
        <div className="space-y-6">
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
