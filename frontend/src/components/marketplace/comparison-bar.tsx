"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

interface ComparisonBarProps {
    selectedCount: number;
    onCompare: () => void;
    onClear: () => void;
}

export function ComparisonBar({ selectedCount, onCompare, onClear }: ComparisonBarProps) {
    const { t } = useLanguage();

    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                    <div className="bg-foreground text-background px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-border/10">
                        <span className="font-medium">
                            {selectedCount}/3 Loan{selectedCount !== 1 ? "s" : ""} Selected
                        </span>

                        <button
                            onClick={onCompare}
                            disabled={selectedCount < 2}
                            className="px-6 py-2 bg-background text-foreground rounded-full font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('compare_now')}
                        </button>

                        <button
                            onClick={onClear}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            aria-label="Clear selection"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
