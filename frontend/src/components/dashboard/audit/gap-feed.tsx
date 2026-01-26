"use client";

import { motion } from "framer-motion";
import { WarningCircle, CheckCircle, Lightbulb } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GapFeedProps {
    redFlags: string[];
    strengths: string[];
    recommendedActions: string[];
}

interface FeedItemProps {
    type: "gap" | "strength" | "action";
    content: string;
    index: number;
}

function FeedItem({ type, content, index }: FeedItemProps) {
    const config = {
        gap: {
            icon: WarningCircle,
            bgColor: "bg-red-50 dark:bg-red-950/30",
            iconBg: "bg-red-100 dark:bg-red-900",
            iconColor: "text-red-600",
            pulseColor: "bg-red-500",
            borderColor: "border-l-red-500"
        },
        strength: {
            icon: CheckCircle,
            bgColor: "bg-green-50 dark:bg-green-950/30",
            iconBg: "bg-green-100 dark:bg-green-900",
            iconColor: "text-green-600",
            pulseColor: "bg-green-500",
            borderColor: "border-l-green-500"
        },
        action: {
            icon: Lightbulb,
            bgColor: "bg-amber-50 dark:bg-amber-950/30",
            iconBg: "bg-amber-100 dark:bg-amber-900",
            iconColor: "text-amber-600",
            pulseColor: "bg-amber-500",
            borderColor: "border-l-amber-500"
        }
    };

    const cfg = config[type];
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className={cn(
                "p-4 rounded-xl border-l-4 flex items-start gap-3",
                cfg.bgColor,
                cfg.borderColor
            )}
        >
            {/* Status Pulse */}
            <div className="relative mt-1">
                <span className={cn("absolute h-2.5 w-2.5 rounded-full animate-ping opacity-75", cfg.pulseColor)} />
                <span className={cn("relative block h-2.5 w-2.5 rounded-full", cfg.pulseColor)} />
            </div>

            {/* Icon */}
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", cfg.iconBg)}>
                <Icon className={cn("h-4 w-4", cfg.iconColor)} />
            </div>

            {/* Content */}
            <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{content}</p>
        </motion.div>
    );
}

export function GapFeed({ redFlags, strengths, recommendedActions }: GapFeedProps) {
    return (
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/30">
            <CardHeader>
                <CardTitle className="font-serif text-lg">Analysis Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Red Flags */}
                {redFlags.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                            <WarningCircle className="h-4 w-4" />
                            Issues to Address ({redFlags.length})
                        </h4>
                        <div className="space-y-2">
                            {redFlags.map((flag, i) => (
                                <FeedItem key={`gap-${i}`} type="gap" content={flag} index={i} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Strengths */}
                {strengths.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Your Strengths ({strengths.length})
                        </h4>
                        <div className="space-y-2">
                            {strengths.map((strength, i) => (
                                <FeedItem key={`strength-${i}`} type="strength" content={strength} index={i + redFlags.length} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommended Actions */}
                {recommendedActions.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Recommended Actions
                        </h4>
                        <div className="space-y-2">
                            {recommendedActions.map((action, i) => (
                                <FeedItem key={`action-${i}`} type="action" content={action} index={i + redFlags.length + strengths.length} />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
