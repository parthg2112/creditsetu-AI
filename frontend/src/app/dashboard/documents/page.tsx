"use client";

import { useState, useCallback } from "react";
import { ProgressTracker } from "@/components/dashboard/progress-tracker";
import { UploadZone } from "@/components/dashboard/upload-zone";
import { ManualInputForm } from "@/components/dashboard/manual-input-form";
import { DemoFileSelector, DemoFile } from "@/components/dashboard/demo-file-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormInput, Upload, FileStack, Sparkles } from "lucide-react";
import { createDocumentRecord } from "@/app/actions";

export default function DocumentsPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [activeTab, setActiveTab] = useState("upload");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedDemoFileId, setSelectedDemoFileId] = useState<string | null>(null);
    const router = useRouter();

    // Called when backend processing completes (via Supabase Realtime)
    const handleProcessingComplete = useCallback((loanId: number, healthScore: string) => {
        console.log("🎉 Processing complete!", { loanId, healthScore });
        toast.success(`Analysis Complete!`, {
            description: `Your Health Score: ${healthScore}/100. Redirecting to results...`,
            duration: 3000
        });
        setTimeout(() => {
            router.push("/dashboard/audit");
        }, 1500);
    }, [router]);

    // Handle manual parameter analysis
    const handleManualAnalyze = async (params: Record<string, string>) => {
        setIsAnalyzing(true);
        try {
            // Call backend API with manual parameters
            const response = await fetch("/api/analyze-manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ params, loanId: 1 })
            });

            if (!response.ok) throw new Error("Analysis failed");

            const result = await response.json();
            toast.success("Analysis Complete!", {
                description: `Health Score: ${result.healthScore}/100`
            });

            setTimeout(() => {
                router.push("/dashboard/audit");
            }, 1000);
        } catch (error) {
            console.error("Analysis error:", error);
            toast.error("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle demo file selection and processing
    const handleDemoFileSelect = async (file: DemoFile) => {
        setSelectedDemoFileId(file.id);

        // If already selected, start processing
        if (selectedDemoFileId === file.id) {
            setIsAnalyzing(true);
            try {
                // Fetch the demo file and upload it
                const response = await fetch(`/${file.filename}`);
                const blob = await response.blob();
                const demoFile = new File([blob], file.filename, { type: "application/pdf" });

                // Upload to storage
                const timestamp = Date.now();
                const filePath = `uploads/demo/${timestamp}_${file.filename}`;

                const formData = new FormData();
                formData.append("file", demoFile);
                formData.append("path", filePath);
                formData.append("bucket", "credit-setu");

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Upload failed");

                // Create document record (this triggers Python backend)
                const result = await createDocumentRecord("demo_user", file.filename, filePath, blob.size);

                if (!result.success) throw new Error("Failed to create document record");

                toast.info(`Analyzing ${file.name}...`, {
                    description: "AI is processing your document"
                });

                // Wait a bit then redirect (realtime will handle the actual completion)
                setTimeout(() => {
                    router.push("/dashboard/audit");
                }, 3000);

            } catch (error) {
                console.error("Demo file error:", error);
                toast.error("Failed to process demo file");
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    return (
        <div className="pb-24">
            <div className="space-y-6">
                <div>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Let&apos;s analyze your loan readiness
                    </h2>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Choose how you&apos;d like to provide your financial information.
                    </p>
                </div>

                <div className="py-4">
                    <ProgressTracker currentStep={1} />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        <TabsTrigger
                            value="upload"
                            className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Upload Documents</span>
                            <span className="sm:hidden">Upload</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="manual"
                            className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                        >
                            <FormInput className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Manual Input</span>
                            <span className="sm:hidden">Manual</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Upload Tab - with Demo Files integrated */}
                    <TabsContent value="upload" className="mt-6 space-y-6">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-primary" />
                                    Document Upload
                                </CardTitle>
                                <CardDescription>
                                    Upload your bank statements, ITR, or other financial documents for AI analysis.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UploadZone
                                    onFilesChanged={setFiles}
                                    files={files}
                                    onProcessingComplete={handleProcessingComplete}
                                />
                            </CardContent>
                        </Card>

                        {/* Demo Files - Integrated as templates */}
                        <Card className="border-border/50 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileStack className="h-4 w-4 text-primary" />
                                    Or try with sample documents
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Don&apos;t have documents ready? Use our pre-loaded samples to test the AI analysis.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DemoFileSelector
                                    onSelectFile={handleDemoFileSelect}
                                    selectedFileId={selectedDemoFileId}
                                    isLoading={isAnalyzing}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Manual Input Tab */}
                    <TabsContent value="manual" className="mt-6">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Quick Financial Assessment
                                </CardTitle>
                                <CardDescription>
                                    Enter your key financial metrics. Pre-filled with sample values for quick testing.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ManualInputForm
                                    onAnalyze={handleManualAnalyze}
                                    isLoading={isAnalyzing}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
