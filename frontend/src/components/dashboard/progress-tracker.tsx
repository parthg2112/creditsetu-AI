"use client";

import { Check, Dot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
    currentStep: number;
}

const STEPS = [
    { id: 1, label: "Upload" },
    { id: 2, label: "Analyze" },
    { id: 3, label: "Results" },
];

export function ProgressTracker({ currentStep }: ProgressTrackerProps) {
    return (
        <div className="relative flex w-full max-w-2xl items-center justify-between">
            {/* Connector Line */}
            <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-800" />

            {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                    <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2">
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                                isActive
                                    ? "border-primary bg-primary text-primary-foreground scale-110"
                                    : isCompleted
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                            )}
                        >
                            {isCompleted ? (
                                <Check className="h-4 w-4" />
                            ) : isActive ? (
                                <div className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
                            ) : (
                                <span className="text-xs font-semibold">{step.id}</span>
                            )}
                        </div>
                        <span className={cn(
                            "text-xs font-semibold uppercase tracking-wider",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
