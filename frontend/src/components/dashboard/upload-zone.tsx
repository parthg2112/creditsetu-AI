"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { createDocumentRecord } from "@/app/actions";
import { createClient } from "@supabase/supabase-js";

// Supabase client for realtime
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProcessingStatus = "idle" | "uploading" | "processing" | "completed" | "failed";

interface FileStatus {
    name: string;
    size: number;
    status: ProcessingStatus;
    progress: number;
    documentId?: number;
    loanId?: number;
}

interface UploadZoneProps {
    onFilesChanged: (files: File[]) => void;
    files: File[];
    onProcessingComplete?: (loanId: number, healthScore: string) => void;
}

export function UploadZone({ onFilesChanged, files, onProcessingComplete }: UploadZoneProps) {
    const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
    const [uploading, setUploading] = useState(false);
    const [userId] = useState("user_123_temp_id");

    // Subscribe to document status changes via Supabase Realtime
    useEffect(() => {
        const documentIds = Object.values(fileStatuses)
            .filter(f => f.documentId && f.status === "processing")
            .map(f => f.documentId);

        if (documentIds.length === 0) return;

        console.log("📡 Subscribing to document updates:", documentIds);

        const channel = supabase
            .channel("document-updates")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "documents",
                },
                (payload) => {
                    const docId = payload.new.id;
                    const newStatus = payload.new.status;

                    console.log(`📡 Document ${docId} status: ${newStatus}`);

                    // Find the file with this document ID
                    const fileEntry = Object.entries(fileStatuses).find(
                        ([_, status]) => status.documentId === docId
                    );

                    if (fileEntry) {
                        const [fileName, _] = fileEntry;

                        if (newStatus === "completed") {
                            setFileStatuses(prev => ({
                                ...prev,
                                [fileName]: { ...prev[fileName], status: "completed", progress: 100 }
                            }));
                            toast.success(`${fileName} processed successfully!`);
                        } else if (newStatus === "failed") {
                            setFileStatuses(prev => ({
                                ...prev,
                                [fileName]: { ...prev[fileName], status: "failed" }
                            }));
                            toast.error(`${fileName} processing failed`);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fileStatuses]);

    // Subscribe to loan updates to get health score
    useEffect(() => {
        const loanIds = [...new Set(
            Object.values(fileStatuses)
                .filter(f => f.loanId)
                .map(f => f.loanId)
        )];

        if (loanIds.length === 0) return;

        const channel = supabase
            .channel("loan-updates")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "loans",
                },
                (payload) => {
                    const loanId = payload.new.id;
                    const status = payload.new.status;
                    const healthScore = payload.new.health_score;

                    console.log(`📡 Loan ${loanId} updated: status=${status}, score=${healthScore}`);

                    if (status === "ready" && healthScore && onProcessingComplete) {
                        onProcessingComplete(loanId, healthScore);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fileStatuses, onProcessingComplete]);

    const onDrop = async (acceptedFiles: File[]) => {
        const newFiles = [...files, ...acceptedFiles];
        const uniqueFiles = newFiles.filter(
            (file, index, self) => index === self.findIndex((t) => t.name === file.name)
        );
        onFilesChanged(uniqueFiles);

        setUploading(true);

        for (const file of acceptedFiles) {
            try {
                // Initialize file status
                setFileStatuses(prev => ({
                    ...prev,
                    [file.name]: {
                        name: file.name,
                        size: file.size,
                        status: "uploading",
                        progress: 0
                    }
                }));

                const timestamp = Date.now();
                const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
                const filePath = `uploads/${userId}/${timestamp}_${safeFilename}`;

                setFileStatuses(prev => ({
                    ...prev,
                    [file.name]: { ...prev[file.name], progress: 20 }
                }));

                // Upload file
                const formData = new FormData();
                formData.append("file", file);
                formData.append("path", filePath);
                formData.append("bucket", "credit-setu");

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error("Upload failed");
                }

                setFileStatuses(prev => ({
                    ...prev,
                    [file.name]: { ...prev[file.name], progress: 50 }
                }));

                // Create document record (this triggers the Python backend)
                const result = await createDocumentRecord(userId, file.name, filePath, file.size);

                if (!result.success || !result.documentId) {
                    throw new Error("Failed to create document record");
                }

                // Update status to processing and store IDs for realtime subscription
                setFileStatuses(prev => ({
                    ...prev,
                    [file.name]: {
                        ...prev[file.name],
                        status: "processing",
                        progress: 70,
                        documentId: result.documentId,
                        loanId: result.loanId
                    }
                }));

                toast.info(`${file.name} - Processing started...`, {
                    description: "AI is analyzing your document"
                });

            } catch (error) {
                console.error("Upload error:", error);
                setFileStatuses(prev => ({
                    ...prev,
                    [file.name]: { ...prev[file.name], status: "failed", progress: 0 }
                }));
                toast.error(`Failed to upload ${file.name}`);
            }
        }
        setUploading(false);
    };

    const removeFile = (fileName: string) => {
        onFilesChanged(files.filter((f) => f.name !== fileName));
        setFileStatuses(prev => {
            const newStatuses = { ...prev };
            delete newStatuses[fileName];
            return newStatuses;
        });
    };

    const getStatusIcon = (status: ProcessingStatus) => {
        switch (status) {
            case "uploading":
            case "processing":
                return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
            case "completed":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "failed":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: ProcessingStatus) => {
        switch (status) {
            case "uploading":
                return "Uploading...";
            case "processing":
                return "AI Processing...";
            case "completed":
                return "Completed!";
            case "failed":
                return "Failed";
            default:
                return "Ready";
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxSize: 50 * 1024 * 1024, // 50MB for larger statements
        disabled: uploading
    });

    const hasProcessingFiles = Object.values(fileStatuses).some(
        f => f.status === "processing" || f.status === "uploading"
    );

    return (
        <div className="flex flex-col gap-6">
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 transition-all duration-300 hover:border-primary/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50",
                    isDragActive && "border-primary bg-primary/5 scale-[1.01]",
                    (uploading || hasProcessingFiles) && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                    {hasProcessingFiles ? (
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    ) : (
                        <UploadCloud className="h-10 w-10" />
                    )}
                </div>
                <div className="text-center space-y-1">
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                        {hasProcessingFiles
                            ? "Processing your documents..."
                            : isDragActive
                                ? "Drop the files here"
                                : "Drag & drop your files here"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {hasProcessingFiles
                            ? "AI is analyzing your financial documents"
                            : "Bank Statements (PDF) up to 50MB"}
                    </p>
                </div>
                {!hasProcessingFiles && (
                    <Button
                        variant="outline"
                        className="mt-4 rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/5"
                        disabled={uploading}
                    >
                        Browse Files
                    </Button>
                )}
            </div>

            {files.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
                    <div className="grid gap-3">
                        {files.map((file) => {
                            const status = fileStatuses[file.name];
                            return (
                                <div
                                    key={file.name}
                                    className={cn(
                                        "flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm transition-all",
                                        status?.status === "completed" && "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20",
                                        status?.status === "failed" && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20",
                                        status?.status === "processing" && "border-primary/30 bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-lg",
                                            status?.status === "completed"
                                                ? "bg-green-100 text-green-600 dark:bg-green-900"
                                                : status?.status === "failed"
                                                    ? "bg-red-100 text-red-600 dark:bg-red-900"
                                                    : "bg-primary/10 text-primary"
                                        )}>
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                {status && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(status.status)}
                                                            {getStatusText(status.status)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {status?.status !== "processing" && status?.status !== "uploading" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => removeFile(file.name)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    {status && (status.status === "uploading" || status.status === "processing") && (
                                        <div className="space-y-1">
                                            <Progress value={status.progress} className="h-1.5" />
                                            <p className="text-xs text-muted-foreground text-center">
                                                {status.status === "processing"
                                                    ? "Parsing, chunking & analyzing..."
                                                    : "Uploading to secure storage..."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
