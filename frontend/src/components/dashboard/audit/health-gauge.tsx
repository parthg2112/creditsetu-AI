"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface HealthGaugeProps {
    score: number;
}

export function HealthGauge({ score }: HealthGaugeProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedScore(score);
        }, 200);
        return () => clearTimeout(timer);
    }, [score]);

    // Calculate the needle angle (from -90 to 90 degrees)
    const needleAngle = -90 + (animatedScore / 100) * 180;

    // Determine color based on score
    const getColor = (s: number) => {
        if (s >= 80) return "#22c55e"; // green-500
        if (s >= 60) return "#eab308"; // yellow-500
        if (s >= 40) return "#f97316"; // orange-500
        return "#ef4444"; // red-500
    };

    const getLabel = (s: number) => {
        if (s >= 80) return "Excellent";
        if (s >= 60) return "Good";
        if (s >= 40) return "Fair";
        return "Poor";
    };

    const color = getColor(animatedScore);
    const label = getLabel(animatedScore);

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-28">
                {/* Background arc */}
                <svg viewBox="0 0 200 110" className="w-full h-full">
                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="25%" stopColor="#f97316" />
                            <stop offset="50%" stopColor="#eab308" />
                            <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                    </defs>

                    {/* Background track */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    {/* Colored arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    {/* Center dot */}
                    <circle cx="100" cy="100" r="8" fill={color} />

                    {/* Needle */}
                    <motion.line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="35"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ rotate: -90 }}
                        animate={{ rotate: needleAngle }}
                        transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.3 }}
                        style={{ transformOrigin: "100px 100px" }}
                    />

                    {/* Score labels */}
                    <text x="20" y="108" fontSize="10" fill="#94a3b8" textAnchor="middle">0</text>
                    <text x="180" y="108" fontSize="10" fill="#94a3b8" textAnchor="middle">100</text>
                </svg>
            </div>

            {/* Score display */}
            <div className="text-center -mt-2">
                <motion.div
                    className="text-4xl font-bold"
                    style={{ color }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {animatedScore}
                </motion.div>
                <motion.div
                    className="text-sm font-medium"
                    style={{ color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {label}
                </motion.div>
            </div>
        </div>
    );
}
