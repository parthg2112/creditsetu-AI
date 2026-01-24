"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ActionBarProps {
    canSubmit: boolean;
    onStartAudit: () => void;
}

export function ActionBar({ canSubmit, onStartAudit }: ActionBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/50 bg-background/80 backdrop-blur-md md:left-64 md:h-[92px]">
            <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-6">
                <p className="text-sm text-muted-foreground hidden sm:block">
                    {canSubmit ? "Ready to analyze documents" : "Please upload required documents to proceed"}
                </p>
                <Button
                    size="lg"
                    className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/20"
                    disabled={!canSubmit}
                    onClick={onStartAudit}
                >
                    Start Audit
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
