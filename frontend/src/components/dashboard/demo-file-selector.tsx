"use client";

import { useState } from "react";
import { FileText, DownloadSimple, Sparkle, CircleNotch } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DemoFile {
    id: string;
    name: string;
    filename: string;
    description: string;
    type: "bank-statement" | "itr" | "loan-application" | "aggregator";
    size: string;
}

const DEMO_FILES: DemoFile[] = [
    {
        id: "demo-bank",
        name: "Bank Statement",
        filename: "demo-bank-statement.pdf",
        description: "6-month account statement with transactions, EMIs, and balance history",
        type: "bank-statement",
        size: "180 KB"
    },
    {
        id: "demo-itr",
        name: "ITR-3 Form",
        filename: "demo-itr3-form.pdf",
        description: "Income Tax Return for business income with P&L details",
        type: "itr",
        size: "2.3 MB"
    },
    {
        id: "demo-loan",
        name: "MSME Loan Application",
        filename: "demo-msme-loan-application.pdf",
        description: "Sample credit application form with business details",
        type: "loan-application",
        size: "3 MB"
    },
    {
        id: "demo-aa",
        name: "Account Aggregator Report",
        filename: "demo-account-aggregator-report.pdf",
        description: "Consolidated financial data from multiple bank accounts",
        type: "aggregator",
        size: "220 KB"
    }
];

interface DemoFileSelectorProps {
    onSelectFile: (file: DemoFile) => void;
    selectedFileId: string | null;
    isLoading: boolean;
}

export function DemoFileSelector({ onSelectFile, selectedFileId, isLoading }: DemoFileSelectorProps) {
    return (
        <div className="space-y-4">

            <div className="grid gap-3 sm:grid-cols-2">
                {DEMO_FILES.map((file) => (
                    <Card
                        key={file.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                            selectedFileId === file.id && "border-primary bg-primary/5 shadow-md"
                        )}
                        onClick={() => !isLoading && onSelectFile(file)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                                    file.type === "bank-statement" && "bg-blue-100 text-blue-600",
                                    file.type === "itr" && "bg-green-100 text-green-600",
                                    file.type === "loan-application" && "bg-purple-100 text-purple-600",
                                    file.type === "aggregator" && "bg-orange-100 text-orange-600"
                                )}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-sm truncate">{file.name}</h4>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            {file.size}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {file.description}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedFileId && (
                <div className="flex justify-center pt-4">
                    <Button
                        size="lg"
                        className="rounded-full px-8 shadow-lg shadow-primary/20"
                        disabled={isLoading}
                        onClick={() => {
                            const file = DEMO_FILES.find(f => f.id === selectedFileId);
                            if (file) onSelectFile(file);
                        }}
                    >
                        {isLoading ? (
                            <>
                                <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkle className="mr-2 h-4 w-4" />
                                Analyze Selected Document
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

export { DEMO_FILES };
export type { DemoFile };
