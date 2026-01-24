"use client";

import { useState, useCallback } from "react";
import { ProgressTracker } from "@/components/dashboard/progress-tracker";
import { UploadZone } from "@/components/dashboard/upload-zone";
import { ChecklistSidebar } from "@/components/dashboard/checklist-sidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DocumentsPage() {
    const [files, setFiles] = useState<File[]>([]);
    const router = useRouter();

    // Called when backend processing completes (via Supabase Realtime)
    const handleProcessingComplete = useCallback((loanId: number, healthScore: string) => {
        console.log("🎉 Processing complete!", { loanId, healthScore });

        // Show success toast with health score
        toast.success(`Analysis Complete!`, {
            description: `Your Health Score: ${healthScore}/100. Redirecting to results...`,
            duration: 3000
        });

        // Redirect to audit page after a brief delay
        setTimeout(() => {
            router.push("/dashboard/audit");
        }, 1500);
    }, [router]);

    return (
        <div className="pb-24">
            <div className="space-y-6">
                <div>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Let's build your financial profile.
                    </h2>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Securely upload your required documents. AI analysis starts automatically.
                    </p>
                </div>

                <div className="py-6">
                    <ProgressTracker currentStep={1} />
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <UploadZone
                            onFilesChanged={setFiles}
                            files={files}
                            onProcessingComplete={handleProcessingComplete}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <ChecklistSidebar files={files} />
                    </div>
                </div>
            </div>
        </div>
    );
}
