"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loan } from "@/types/loan";
import { LoanCard } from "./loan-card";
import { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

interface MarketplaceSectionProps {
    title: string;
    loans: Loan[];
    selectedLoans: Set<string>;
    onToggleSelect: (loanId: string) => void;
}

export function MarketplaceSection({ title, loans, selectedLoans, onToggleSelect }: MarketplaceSectionProps) {
    const { t } = useLanguage();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            // Allow a small buffer (e.g., 10px) for rounding errors
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [loans]);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340; // Card width + gap
            const newScrollLeft =
                scrollContainerRef.current.scrollLeft +
                (direction === "left" ? -scrollAmount : scrollAmount);

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: "smooth",
            });

            // Check scroll state after animation
            setTimeout(checkScroll, 300);
        }
    };

    return (
        <div className="relative group py-6">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-serif font-bold text-foreground">{title}</h2>
                <button className="text-sm text-primary hover:underline font-medium">
                    {t('view_all')}
                </button>
            </div>

            <div className="relative">
                {/* Left Arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background/95 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-background border border-border"
                        style={{ transform: "translate(-50%, -50%)" }}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                )}

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {loans.map((loan) => (
                        <LoanCard
                            key={loan.id}
                            loan={loan}
                            isSelected={selectedLoans.has(loan.id)}
                            onToggleSelect={() => onToggleSelect(loan.id)}
                        />
                    ))}
                </div>

                {/* Right Arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background/95 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-background border border-border"
                        style={{ transform: "translate(50%, -50%)" }}
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-6 h-6 text-foreground" />
                    </button>
                )}
            </div>
        </div>
    );
}
