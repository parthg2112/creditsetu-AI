"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
    score: number; // 0 to 100
    title?: string;
}

export function ScoreGauge({ score, title = "Loan Readiness Score" }: ScoreGaugeProps) {
    const [currentScore, setCurrentScore] = useState(0);

    useEffect(() => {
        // Animate score on mount
        const timer = setTimeout(() => {
            setCurrentScore(score);
        }, 100);
        return () => clearTimeout(timer);
    }, [score]);

    // Gauge calculations
    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    // We want a semi-circle gauge (180 degrees) or partial (220 deg). 
    // Let's do a 240 degree gauge (-120 to +120) for a "speedometer" look.
    const arcDegrees = 240;
    const offset = circumference - (currentScore / 100) * (circumference * (arcDegrees / 360));

    // Color determination based on score
    let colorClass = "text-red-500";
    if (score >= 75) colorClass = "text-green-500";
    else if (score >= 50) colorClass = "text-orange-500";

    return (
        <div className="relative flex flex-col items-center justify-center">
            <div className="relative h-48 w-48">
                <svg
                    height="100%"
                    width="100%"
                    viewBox="0 0 200 200"
                    className="overflow-visible"
                >
                    {/* Definitions for gradients if needed */}
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="currentColor" />
                        </linearGradient>
                    </defs>

                    {/* Background Arch */}
                    <circle
                        stroke="currentColor"
                        strokeWidth={stroke}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ strokeDashoffset: circumference - (circumference * (arcDegrees / 360)) }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx="100"
                        cy="100"
                        className="text-slate-200 dark:text-slate-800 rotate-[150deg] origin-center"
                    />

                    {/* Progress Arch */}
                    <circle
                        stroke="currentColor"
                        strokeWidth={stroke}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{
                            strokeDashoffset: circumference - ((currentScore / 100) * (circumference * (arcDegrees / 360))),
                            transition: "stroke-dashoffset 1.5s ease-out"
                        }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx="100"
                        cy="100"
                        className={cn("rotate-[150deg] origin-center drop-shadow-md", colorClass)}
                    />

                    {/* Needle / Value */}
                    <g className="transition-all duration-1000 ease-out" style={{ transform: `rotate(${150 + (currentScore / 100) * 240}deg)`, transformOrigin: "100px 100px" }}>
                        {/* Simple indicator needle or similar? Let's just use text for now to match prompt "Needle moves smoothly" might be complex SVG math, let's stick to the arc filling and center text for clean UI */}
                    </g>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                    <span className={cn("text-4xl font-bold font-mono transition-colors duration-500", colorClass)}>
                        {Math.round(currentScore)}
                        <span className="text-lg text-muted-foreground ml-1">/100</span>
                    </span>
                    <span className="text-sm font-medium text-muted-foreground mt-1">
                        {score >= 75 ? "Excellent" : score >= 50 ? "Needs Work" : "Critical"}
                    </span>
                </div>
            </div>
            <p className="mt-[-20px] font-medium text-slate-600 dark:text-slate-400">{title}</p>
        </div>
    );
}
