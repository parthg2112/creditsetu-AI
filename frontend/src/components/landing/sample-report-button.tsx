"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleNotch, FileText } from "@phosphor-icons/react";

export function SampleReportButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            // Proxied through frontend to avoid CORS issues if on different ports
            // Ideally should be /api/report/sample if configured, 
            // but assuming direct backend call for now or absolute URL if dev env
            // Using window.location.origin to detect context

            const response = await fetch("http://localhost:8000/report/sample");

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "CreditSetu_Sample_Report.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download sample report:", error);
            alert("Could not download sample report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="lg"
            onClick={handleDownload}
            disabled={isLoading}
            className="h-12 rounded-full px-8 text-base border-[#D46B4F]/20 text-[#D46B4F] hover:bg-[#D46B4F]/5"
        >
            {isLoading ? (
                <>
                    <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    View Sample Report
                    <FileText className="ml-2 h-4 w-4" />
                </>
            )}
        </Button>
    );
}
