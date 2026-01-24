"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

interface RadarDataPoint {
    category: string;
    value: number;
    fullMark: number;
}

interface ReadinessRadarProps {
    data: RadarDataPoint[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-border/50">
                <p className="font-semibold text-sm">{data.category}</p>
                <p className="text-sm text-muted-foreground">
                    Score: <span className="font-medium text-primary">{data.value}/100</span>
                </p>
                {data.value < 60 && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Needs improvement</p>
                )}
            </div>
        );
    }
    return null;
};

export function ReadinessRadar({ data }: ReadinessRadarProps) {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickCount={5}
                />
                <Radar
                    name="Readiness"
                    dataKey="value"
                    stroke="#334155"
                    fill="#334155"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    animationDuration={1000}
                    animationEasing="ease-out"
                />
                <Tooltip content={<CustomTooltip />} />
            </RadarChart>
        </ResponsiveContainer>
    );
}
