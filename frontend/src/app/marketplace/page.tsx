"use client";

import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { MarketplaceSection } from "@/components/marketplace/marketplace-section";
import { ComparisonBar } from "@/components/marketplace/comparison-bar";
import { ComparisonModal } from "@/components/marketplace/comparison-modal";
import { loanData, categories } from "@/data/loan-marketplace";

export default function MarketplacePage() {
    const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);

    const toggleSelect = (loanId: string) => {
        const newSelected = new Set(selectedLoans);
        if (newSelected.has(loanId)) {
            newSelected.delete(loanId);
        } else {
            if (newSelected.size >= 3) {
                // Optional: Show toast notification that max 3 loans can be selected
                return;
            }
            newSelected.add(loanId);
        }
        setSelectedLoans(newSelected);
    };

    const clearSelection = () => {
        setSelectedLoans(new Set());
    };

    const selectedLoanData = loanData.filter(loan => selectedLoans.has(loan.id));

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Header />

            <main className="container mx-auto px-4 py-8 space-y-12 pb-32">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                        Loan Marketplace
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Compare and apply for the best loan offers tailored for your needs.
                    </p>
                </div>

                <div className="space-y-12">
                    {categories.map((category) => {
                        const categoryLoans = loanData.filter(loan => loan.category === category.id);
                        if (categoryLoans.length === 0) return null;

                        return (
                            <MarketplaceSection
                                key={category.id}
                                title={category.title}
                                loans={categoryLoans}
                                selectedLoans={selectedLoans}
                                onToggleSelect={toggleSelect}
                            />
                        );
                    })}
                </div>
            </main>

            <ComparisonBar
                selectedCount={selectedLoans.size}
                onCompare={() => setIsComparisonOpen(true)}
                onClear={clearSelection}
            />

            <ComparisonModal
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
                loans={selectedLoanData}
            />
        </div>
    );
}
