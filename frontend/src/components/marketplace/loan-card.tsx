"use client";

import { Loan } from "@/types/loan";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

interface LoanCardProps {
    loan: Loan;
    isSelected: boolean;
    onToggleSelect: () => void;
}

export function LoanCard({ loan, isSelected, onToggleSelect }: LoanCardProps) {
    const { t } = useLanguage();

    return (
        <motion.div
            whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className={`relative bg-card rounded-xl transition-all duration-300 border border-border ${isSelected ? "ring-2 ring-primary shadow-lg shadow-primary/10" : "shadow-md hover:shadow-xl hover:shadow-primary/5"
                }`}
            style={{
                width: "320px",
                minWidth: "320px",
                height: "340px",
                boxShadow: isSelected ? undefined : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center relative overflow-hidden rounded-md">
                        {loan.bankLogo.startsWith('/') ? (
                            <img
                                src={loan.bankLogo}
                                alt={loan.bankName}
                                className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal"
                            />
                        ) : (
                            <span className="text-2xl">{loan.bankLogo}</span>
                        )}
                    </div>
                    <span className="font-medium text-foreground">{loan.bankName}</span>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col items-center justify-center space-y-3">
                <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{loan.interestRate}%</div>
                    <div className="text-sm text-muted-foreground">{t('pa_onwards')}</div>
                </div>

                <div className="text-center">
                    <div className="text-sm text-muted-foreground">{t('max_amount')}</div>
                    <div className="text-xl font-semibold text-foreground">{loan.maxAmount}</div>
                </div>
            </div>

            {/* Tags */}
            <div className="px-4 pb-3 flex flex-wrap gap-2 justify-center">
                {loan.tags.slice(0, 2).map((tag, idx) => (
                    <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${tag.includes("No Collateral") || tag.includes("Best Rate")
                            ? "bg-primary/10 text-primary"
                            : tag.includes("Instant") || tag.includes("Quick") || tag.includes("Fast")
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : tag.includes("Low Rate") || tag.includes("Low")
                                    ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                    : "bg-secondary text-secondary-foreground"
                            }`}
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between border-t border-border bg-card rounded-b-xl">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('compare')}</span>
                </label>

                {!isSelected && (
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                        {t('apply_now')}
                    </button>
                )}
            </div>
        </motion.div>
    );
}
