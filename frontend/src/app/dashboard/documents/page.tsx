"use client";

import { useState } from "react";
import { ProgressTracker } from "@/components/dashboard/progress-tracker";
import { UploadZone } from "@/components/dashboard/upload-zone";
import { ChecklistSidebar } from "@/components/dashboard/checklist-sidebar";
import { ActionBar } from "@/components/dashboard/action-bar";

import { useRouter } from "next/navigation";
import { ProcessingScreen } from "@/components/dashboard/processing-screen";
import { toast } from "sonner";

export default function DocumentsPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handleStartAudit = () => {
        setIsProcessing(true);
    };

    const handleProcessingComplete = () => {
        setIsProcessing(false);
        toast.success("Audit complete! Redirecting to results...");
        router.push("/dashboard/audit");
    };

    return (
        <div className="pb-24">
            {isProcessing && <ProcessingScreen onComplete={handleProcessingComplete} />}

            <div className="space-y-6">
                <div>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Let's build your financial profile.
                    </h2>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Securely upload your required documents to start the audit.
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
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <ChecklistSidebar files={files} />
                    </div>
                </div>
            </div>

            <ActionBar canSubmit={files.length > 0} onStartAudit={handleStartAudit} />
        </div>
    );
}
