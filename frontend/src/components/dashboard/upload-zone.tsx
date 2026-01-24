"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { createDocumentRecord } from "@/app/actions";

interface UploadZoneProps {
    onFilesChanged: (files: File[]) => void;
    files: File[];
}

export function UploadZone({ onFilesChanged, files }: UploadZoneProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [userId] = useState("user_123_temp_id"); // Temporary hardcoded user ID

    const onDrop = async (acceptedFiles: File[]) => {
        // 1. Update local files state first for UI
        const newFiles = [...files, ...acceptedFiles];
        const uniqueFiles = newFiles.filter(
            (file, index, self) => index === self.findIndex((t) => t.name === file.name)
        );
        onFilesChanged(uniqueFiles);

        // 2. Start Upload Process
        setUploading(true);

        for (const file of acceptedFiles) {
            try {
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

                // Generate Path
                const timestamp = Date.now();
                const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
                const filePath = `uploads/${userId}/${timestamp}_${safeFilename}`;

                setUploadProgress(prev => ({ ...prev, [file.name]: 10 }));

                // Upload via Server API Route to bypass RLS
                const formData = new FormData();
                formData.append("file", file);
                formData.append("path", filePath);
                formData.append("bucket", "credit-setu"); // Using user's bucket name

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json();
                    throw new Error(errorData.error || "Upload failed");
                }

                setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

                // 3. Call Server Action
                const result = await createDocumentRecord(userId, file.name, filePath, file.size);

                if (!result.success || !result.documentId) {
                    throw new Error("Failed to create document record");
                }

                console.log("Document Created with ID:", result.documentId);

                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                toast.success(`${file.name} uploaded successfully`);

            } catch (error) {
                console.error("Upload error:", error);
                toast.error(`Failed to upload ${file.name}`);
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
            }
        }
        setUploading(false);
    };

    const removeFile = (fileName: string) => {
        onFilesChanged(files.filter((f) => f.name !== fileName));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        disabled: uploading
    });

    return (
        <div className="flex flex-col gap-6">
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 transition-all duration-300 hover:border-primary/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50",
                    isDragActive && "border-primary bg-primary/5 scale-[1.01]",
                    uploading && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <UploadCloud className="h-10 w-10" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                        {isDragActive ? "Drop the files here" : "Drag & drop your files here"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Bank Statements (PDF) up to 10MB
                    </p>
                </div>
                <Button variant="outline" className="mt-4 rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/5" disabled={uploading}>
                    Browse Files
                </Button>
            </div>

            {files.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Uploaded Documents</h3>
                    <div className="grid gap-3">
                        {files.map((file) => (
                            <div key={file.name} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    {!uploading && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => removeFile(file.name)}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove file</span>
                                        </Button>
                                    )}
                                </div>
                                {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                                    <Progress value={uploadProgress[file.name]} className="h-1.5" />
                                )}
                                {uploadProgress[file.name] === 100 && (
                                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Uploaded & Queued
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
