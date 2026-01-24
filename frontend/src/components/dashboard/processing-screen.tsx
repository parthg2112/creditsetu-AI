"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProcessingScreenProps {
    onComplete?: () => void;
}

const MESSAGES = [
    "Securely encrypting and uploading files...",
    "OCR Engine: Reading transaction tables...",
    "RAG Agent: Cross-referencing KYC data...",
    "Financial Analyst: Calculating Debt-to-Income ratios...",
];

export function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Message cycling logic
        const messageInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 3000);

        // Progress simulation logic
        const duration = 12000; // 12 seconds total for 4 messages roughly
        const intervalTime = 100;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const progressInterval = setInterval(() => {
            currentStep++;
            const newProgress = Math.min((currentStep / steps) * 100, 100);
            setProgress(newProgress);

            if (currentStep >= steps) {
                clearInterval(progressInterval);
                clearInterval(messageInterval);
                if (onComplete) {
                    onComplete();
                }
            }
        }, intervalTime);

        return () => {
            clearInterval(messageInterval);
            clearInterval(progressInterval);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-sm dark:bg-slate-950/95">
            {/* Background Animation - Subtle Network Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <svg className="absolute h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    {/* Floating circles/nodes */}
                    <circle cx="20%" cy="30%" r="2" className="text-primary fill-current animate-pulse opacity-50" />
                    <circle cx="80%" cy="70%" r="3" className="text-primary fill-current animate-bounce opacity-40 delay-1000" />
                    <circle cx="50%" cy="50%" r="1" className="text-primary fill-current animate-ping opacity-30 delay-200" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12">
                {/* Circular Progress Pulse */}
                <div className="relative flex items-center justify-center">
                    {/* Pulsing glow */}
                    <div className="absolute h-48 w-48 rounded-full bg-primary/20 animate-ping opacity-75 duration-[3000ms]" />
                    <div className="absolute h-64 w-64 rounded-full bg-primary/10 animate-pulse duration-[4000ms]" />

                    {/* SVG Circle Progress */}
                    <div className="relative h-40 w-40">
                        <svg className="h-full w-full -rotate-90">
                            {/* Background Circle */}
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-slate-200 dark:text-slate-800"
                            />
                            {/* Progress Circle */}
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray="440" // 2 * PI * 70 ≈ 440
                                strokeDashoffset={440 - (440 * progress) / 100}
                                strokeLinecap="round"
                                className="text-primary transition-all duration-300 ease-linear"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary font-mono">{Math.round(progress)}%</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Text */}
                <div className="h-16 flex items-center justify-center">
                    <p
                        key={messageIndex} // Key forces re-render for animation
                        className="text-xl font-serif font-medium text-slate-700 dark:text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-500 text-center px-4"
                    >
                        {MESSAGES[messageIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
}
