"use client";

import { CheckCircle, Circle } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChecklistSidebarProps {
    files: File[];
}

export function ChecklistSidebar({ files }: ChecklistSidebarProps) {
    // Simple logic: Check off items if ANY file is uploaded.
    // In a real app, you'd check file types/names or use AI to classify.
    const hasBankStatement = files.some(f => f.name.toLowerCase().includes("bank") || f.name.toLowerCase().includes("statement") || files.length > 0); // Temporary easy check

    const REQUIREMENTS = [
        { label: "Last 6 Months Bank Statement", required: true, fulfilled: hasBankStatement },
        { label: "Latest ITR Filing", required: false, fulfilled: false },
        { label: "Business Registration Proof", required: false, fulfilled: false },
    ];

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {REQUIREMENTS.map((req, index) => (
                    <div key={index} className="flex items-start gap-3">
                        {req.fulfilled ? (
                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600 shrink-0" />
                        ) : (
                            <Circle className="mt-0.5 h-5 w-5 text-slate-300 shrink-0" />
                        )}
                        <div className="space-y-0.5">
                            <p className={cn("text-sm font-medium", req.fulfilled ? "text-slate-900 line-through decoration-slate-400 opacity-60" : "text-slate-700")}>
                                {req.label}
                            </p>
                            {req.required && !req.fulfilled && (
                                <span className="text-xs font-semibold text-red-500">Required</span>
                            )}
                            {!req.required && (
                                <span className="text-xs text-muted-foreground">Optional</span>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
