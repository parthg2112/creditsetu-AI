"use client";

import { X, Check } from "lucide-react";
import { Loan } from "@/types/loan";
import { motion, AnimatePresence } from "framer-motion";

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    loans: Loan[];
}

export function ComparisonModal({ isOpen, onClose, loans }: ComparisonModalProps) {
    // Safety check for empty loans array
    if (loans.length === 0) {
        return null;
    }

    const lowestRate = Math.min(...loans.map(l => l.interestRate));
    const lowestFee = loans.reduce((lowest, loan) => {
        if (loan.processingFee.toLowerCase().includes("zero") || loan.processingFee.toLowerCase().includes("nil")) {
            return "Zero";
        }
        return lowest;
    }, loans[0].processingFee);

    const hasZeroFee = lowestFee === "Zero";

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto border border-border">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border bg-card">
                                <h2 className="text-2xl font-serif font-bold text-foreground">Compare Loans</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-auto p-6 bg-muted/30">
                                <div className="grid gap-6" style={{ gridTemplateColumns: `200px repeat(${loans.length}, 1fr)` }}>
                                    {/* Bank Names Row */}
                                    <div className="font-semibold text-muted-foreground self-center"></div>
                                    {loans.map((loan) => (
                                        <div key={loan.id} className="flex flex-col items-center gap-3 p-4 bg-card rounded-lg border border-border shadow-sm">
                                            <div className="text-4xl">{loan.bankLogo}</div>
                                            <div className="font-semibold text-center text-foreground">{loan.bankName}</div>
                                        </div>
                                    ))}

                                    {/* Interest Rate */}
                                    <div className="font-semibold text-muted-foreground self-center">Interest Rate</div>
                                    {loans.map((loan) => (
                                        <div
                                            key={loan.id}
                                            className={`p-4 rounded-lg text-center ${loan.interestRate === lowestRate
                                                ? "bg-primary/5 border-2 border-primary dark:bg-primary/10 dark:border-primary"
                                                : "bg-card border border-border"
                                                }`}
                                        >
                                            <div className="text-2xl font-bold text-primary">{loan.interestRate}%</div>
                                            <div className="text-sm text-muted-foreground">p.a. onwards</div>
                                            {loan.interestRate === lowestRate && (
                                                <div className="mt-2 flex items-center justify-center gap-1 text-primary text-sm font-medium">
                                                    <Check className="w-4 h-4" />
                                                    Lowest Rate
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Max Amount */}
                                    <div className="font-semibold text-muted-foreground self-center">Max Amount</div>
                                    {loans.map((loan) => (
                                        <div key={loan.id} className="p-4 bg-card border border-border rounded-lg text-center">
                                            <div className="text-xl font-semibold text-foreground">{loan.maxAmount}</div>
                                        </div>
                                    ))}

                                    {/* Processing Fee */}
                                    <div className="font-semibold text-muted-foreground self-center">Processing Fee</div>
                                    {loans.map((loan) => (
                                        <div
                                            key={loan.id}
                                            className={`p-4 rounded-lg text-center ${hasZeroFee && (loan.processingFee.toLowerCase().includes("zero") || loan.processingFee.toLowerCase().includes("nil"))
                                                ? "bg-primary/5 border-2 border-primary dark:bg-primary/10 dark:border-primary"
                                                : "bg-card border border-border"
                                                }`}
                                        >
                                            <div className="text-sm font-medium text-foreground">{loan.processingFee}</div>
                                            {hasZeroFee && (loan.processingFee.toLowerCase().includes("zero") || loan.processingFee.toLowerCase().includes("nil")) && (
                                                <div className="mt-2 flex items-center justify-center gap-1 text-primary text-sm font-medium">
                                                    <Check className="w-4 h-4" />
                                                    Best Deal
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Prepayment Charges */}
                                    <div className="font-semibold text-muted-foreground self-center">Prepayment Charges</div>
                                    {loans.map((loan) => (
                                        <div
                                            key={loan.id}
                                            className={`p-4 rounded-lg text-center ${loan.prepaymentCharges.toLowerCase().includes("zero") || loan.prepaymentCharges.toLowerCase().includes("nil")
                                                ? "bg-primary/5 border-2 border-primary dark:bg-primary/10 dark:border-primary"
                                                : "bg-card border border-border"
                                                }`}
                                        >
                                            <div className="text-sm font-medium text-foreground">{loan.prepaymentCharges}</div>
                                            {(loan.prepaymentCharges.toLowerCase().includes("zero") || loan.prepaymentCharges.toLowerCase().includes("nil")) && (
                                                <div className="mt-2 flex items-center justify-center gap-1 text-primary text-sm font-medium">
                                                    <Check className="w-4 h-4" />
                                                    No Charges
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Features */}
                                    <div className="font-semibold text-muted-foreground self-start pt-4">Key Features</div>
                                    {loans.map((loan) => (
                                        <div key={loan.id} className="p-4 bg-card border border-border rounded-lg">
                                            <ul className="space-y-2">
                                                {loan.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                                                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}

                                    {/* Apply Buttons */}
                                    <div className="self-center"></div>
                                    {loans.map((loan) => (
                                        <div key={loan.id} className="p-4">
                                            <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md">
                                                Apply Now
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
