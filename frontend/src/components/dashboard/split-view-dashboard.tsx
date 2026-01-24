"use client";

import { useState, useRef, useEffect, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Loader2, Sparkles, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { ReadinessRadar } from "./audit/readiness-radar";
import { HealthGauge } from "./audit/health-gauge";
import { GapFeed } from "./audit/gap-feed";
import { cn } from "@/lib/utils";

// Chat message type
interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    type?: "text" | "quick-reply";
    quickReplies?: string[];
}

// Audit data type
interface AuditData {
    healthScore: number;
    redFlags: string[];
    strengths: string[];
    summary: string;
    recommendedActions: string[];
    radarData: { category: string; value: number; fullMark: number }[];
}

// Onboarding stages - 10 parameter collection flow
type OnboardingStage =
    | "loan-amount"           // 10. Loan Amount Requested
    | "annual-income"         // 8. Annual Income
    | "monthly-debt"          // 9. Current Monthly Debt
    | "payment-history"       // 1. Payment Reliability (35%)
    | "credit-utilization"    // 2. Credit Utilization (30%)
    | "credit-age"            // 3. Age of Credit History (15%)
    | "credit-lines"          // 4. Active Credit Lines (10%)
    | "recent-inquiries"      // 5. Recent Inquiries (10%)
    | "bankruptcy"            // 6. Bankruptcy History (Penalty)
    | "defaults"              // 7. Default History (Penalty)
    | "processing"
    | "complete";

// The 10 mandatory parameters for credit score calculation
interface CreditParams {
    // Core loan request
    loanAmountRequested: string;    // 10
    annualIncome: string;           // 8
    monthlyDebt: string;            // 9
    // Credit score factors
    paymentHistoryRating: string;   // 1 - 35% weight
    creditUtilization: string;      // 2 - 30% weight  
    creditHistoryYears: string;     // 3 - 15% weight
    openCreditLines: string;        // 4 - 10% weight
    recentInquiries: string;        // 5 - 10% weight
    // Penalties
    bankruptcyHistory: string;      // 6 - -150 points
    defaultsHistory: string;        // 7 - -100 points
}

const INITIAL_PARAMS: CreditParams = {
    loanAmountRequested: "",
    annualIncome: "",
    monthlyDebt: "",
    paymentHistoryRating: "",
    creditUtilization: "",
    creditHistoryYears: "",
    openCreditLines: "",
    recentInquiries: "",
    bankruptcyHistory: "",
    defaultsHistory: ""
};

export function SplitViewDashboard() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Welcome to **CreditSetu AI**! 🏦\n\nI'll help you assess your loan readiness and calculate your credit score. Let's start with the basics.\n\n**How much loan are you looking for?**",
            type: "quick-reply",
            quickReplies: ["₹5 Lakh", "₹10 Lakh", "₹25 Lakh", "₹50 Lakh+", "₹1 Crore+"]
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [stage, setStage] = useState<OnboardingStage>("loan-amount");
    const [auditData, setAuditData] = useState<AuditData | null>(null);
    const [creditParams, setCreditParams] = useState<CreditParams>(INITIAL_PARAMS);
    const [mobileTab, setMobileTab] = useState<"chat" | "dashboard">("chat");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change or loading state changes
    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        };
        // Use requestAnimationFrame + small timeout to ensure DOM has updated
        const timeoutId = setTimeout(() => {
            requestAnimationFrame(scrollToBottom);
        }, 50);
        return () => clearTimeout(timeoutId);
    }, [messages, isLoading]);

    const addMessage = (msg: Omit<Message, "id">) => {
        const uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setMessages(prev => [...prev, { ...msg, id: uniqueId }]);
    };

    // Credit Score Calculation Function
    const calculateCreditScore = (params: CreditParams): number => {
        // Base score starts at 300 (FICO-like)
        let score = 300;

        // 1. Payment History (35% weight) - max 245 points
        const paymentRating = parseInt(params.paymentHistoryRating) || 30;
        score += Math.round((paymentRating / 60) * 245);

        // 2. Credit Utilization (30% weight) - max 210 points
        const utilization = parseInt(params.creditUtilization) || 50;
        if (utilization <= 30) score += 210;
        else if (utilization <= 50) score += 150;
        else if (utilization <= 75) score += 80;
        else score += 30;

        // 3. Credit History Age (15% weight) - max 105 points
        const years = parseInt(params.creditHistoryYears) || 2;
        if (years >= 10) score += 105;
        else if (years >= 7) score += 85;
        else if (years >= 5) score += 65;
        else if (years >= 3) score += 45;
        else score += 20;

        // 4. Credit Mix (10% weight) - max 70 points
        const creditLines = parseInt(params.openCreditLines) || 1;
        if (creditLines >= 3 && creditLines <= 6) score += 70;
        else if (creditLines >= 2) score += 50;
        else if (creditLines >= 1) score += 30;
        else score += 10;

        // 5. Recent Inquiries (10% weight) - max 70 points
        const inquiries = parseInt(params.recentInquiries) || 2;
        if (inquiries === 0) score += 70;
        else if (inquiries === 1) score += 55;
        else if (inquiries <= 3) score += 35;
        else score += 10;

        // 6. Bankruptcy Penalty (-150 points)
        if (params.bankruptcyHistory === "Yes") {
            score -= 150;
        }

        // 7. Default Penalty (-100 points)
        if (params.defaultsHistory === "Yes") {
            score -= 100;
        }

        // Clamp score between 300 and 900
        return Math.max(300, Math.min(900, score));
    };

    // Calculate DTI and affordability
    const calculateDTI = (monthlyDebt: string, annualIncome: string): number => {
        const debt = parseInt(monthlyDebt.replace(/[^\d]/g, "")) || 0;
        const monthlyIncome = (parseInt(annualIncome.replace(/[^\d]/g, "")) || 0) / 12;
        if (monthlyIncome === 0) return 0;
        return Math.round((debt / monthlyIncome) * 100);
    };

    // Function to run credit score analysis
    const runCreditAnalysis = async (params: CreditParams) => {
        setStage("processing");
        setIsLoading(true);

        addMessage({
            role: "assistant",
            content: "🔄 Calculating your credit score and loan eligibility..."
        });

        // Calculate credit score
        const creditScore = calculateCreditScore(params);
        const dti = calculateDTI(params.monthlyDebt, params.annualIncome);

        // Determine health score (0-100 scale for UI)
        const healthScore = Math.round(((creditScore - 300) / 600) * 100);

        // Generate analysis
        const redFlags: string[] = [];
        const strengths: string[] = [];
        const recommendedActions: string[] = [];

        // Analyze each factor
        const utilization = parseInt(params.creditUtilization) || 50;
        if (utilization > 50) {
            redFlags.push(`High credit utilization at ${utilization}% (recommended: under 30%)`);
            recommendedActions.push("Pay down credit card balances to reduce utilization");
        } else if (utilization <= 30) {
            strengths.push(`Excellent credit utilization at ${utilization}%`);
        }

        if (params.bankruptcyHistory === "Yes") {
            redFlags.push("Bankruptcy on record (-150 points impact)");
            recommendedActions.push("Continue rebuilding credit for 7-10 years post-bankruptcy");
        }

        if (params.defaultsHistory === "Yes") {
            redFlags.push("Loan default history (-100 points impact)");
            recommendedActions.push("Work with creditors to settle outstanding defaults");
        }

        const years = parseInt(params.creditHistoryYears) || 0;
        if (years >= 5) {
            strengths.push(`Strong credit history of ${years} years`);
        } else if (years < 2) {
            redFlags.push("Limited credit history (under 2 years)");
            recommendedActions.push("Keep oldest accounts open to build history");
        }

        const inquiries = parseInt(params.recentInquiries) || 0;
        if (inquiries > 3) {
            redFlags.push(`${inquiries} recent credit inquiries (impacts score negatively)`);
            recommendedActions.push("Avoid applying for new credit for 6 months");
        } else if (inquiries <= 1) {
            strengths.push("Minimal recent credit inquiries");
        }

        if (dti > 40) {
            redFlags.push(`High DTI ratio of ${dti}% (recommended: under 40%)`);
            recommendedActions.push("Pay off existing debts before applying for new loans");
        } else if (dti <= 30) {
            strengths.push(`Healthy DTI ratio of ${dti}%`);
        }

        const paymentRating = parseInt(params.paymentHistoryRating) || 30;
        if (paymentRating >= 50) {
            strengths.push("Strong payment history record");
        } else if (paymentRating < 30) {
            redFlags.push("Poor payment history");
            recommendedActions.push("Set up automatic payments to avoid future missed payments");
        }

        // Generate summary
        let summary = "";
        if (creditScore >= 750) {
            summary = `Excellent credit score of ${creditScore}! You're highly likely to get loan approval with favorable terms.`;
        } else if (creditScore >= 650) {
            summary = `Good credit score of ${creditScore}. You should qualify for most loans, though rates may vary.`;
        } else if (creditScore >= 550) {
            summary = `Fair credit score of ${creditScore}. You may qualify for some loans but should work on improving your score.`;
        } else {
            summary = `Credit score of ${creditScore} needs improvement. Focus on the recommended actions to boost your eligibility.`;
        }

        const newAuditData: AuditData = {
            healthScore,
            redFlags,
            strengths,
            summary,
            recommendedActions,
            radarData: [
                { category: "Payment History", value: Math.round((paymentRating / 60) * 100), fullMark: 100 },
                { category: "Credit Usage", value: Math.max(0, 100 - utilization), fullMark: 100 },
                { category: "Credit Age", value: Math.min(100, years * 10), fullMark: 100 },
                { category: "Credit Mix", value: Math.min(100, parseInt(params.openCreditLines) * 20 || 20), fullMark: 100 },
                { category: "New Credit", value: Math.max(0, 100 - inquiries * 20), fullMark: 100 },
                { category: "DTI Ratio", value: Math.max(0, 100 - dti), fullMark: 100 }
            ]
        };

        setAuditData(newAuditData);
        setStage("complete");
        setIsLoading(false);

        addMessage({
            role: "assistant",
            content: `✅ **Analysis Complete!**\n\n📊 **Credit Score: ${creditScore}/900**\n💰 **DTI Ratio: ${dti}%**\n\n${summary}\n\n${redFlags.length > 0 ? `⚠️ Found ${redFlags.length} areas needing attention.` : "✨ No major concerns found!"}\n\nCheck the dashboard on the right for full details.`
        });

        setMobileTab("dashboard");
    };

    const handleQuickReply = async (reply: string) => {
        addMessage({ role: "user", content: reply });

        // Stage 1: Loan Amount
        if (stage === "loan-amount") {
            setCreditParams(prev => ({ ...prev, loanAmountRequested: reply }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: `Got it, looking for a **${reply}** loan. 💼\n\nNow, what's your **annual income** (before taxes)?`,
                    type: "quick-reply",
                    quickReplies: ["Under ₹5 Lakh", "₹5-10 Lakh", "₹10-25 Lakh", "₹25-50 Lakh", "₹50 Lakh+"]
                });
                setStage("annual-income");
            }, 400);
        }
        // Stage 2: Annual Income
        else if (stage === "annual-income") {
            setCreditParams(prev => ({ ...prev, annualIncome: reply }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "How much do you pay in **monthly debt obligations** (EMIs, credit card bills, etc.)?",
                    type: "quick-reply",
                    quickReplies: ["₹0 (No debt)", "Under ₹10K", "₹10K-25K", "₹25K-50K", "₹50K+"]
                });
                setStage("monthly-debt");
            }, 400);
        }
        // Stage 4: Payment History (35%) - starts the 7 questions
        else if (stage === "monthly-debt") {
            setCreditParams(prev => ({ ...prev, monthlyDebt: reply }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "Great! Now let's assess your credit profile with 7 quick questions.\n\n**Question 1 of 7** 📝\n\nOn a scale of 0-60, how would you rate your **payment reliability**?\n\n*(60 = Perfect, never missed a payment. 0 = Many missed payments)*",
                    type: "quick-reply",
                    quickReplies: ["55-60 (Excellent)", "45-54 (Good)", "30-44 (Fair)", "15-29 (Poor)", "0-14 (Very Poor)"]
                });
                setStage("payment-history");
            }, 400);
        }
        // Stage 5: Payment History (35%)
        else if (stage === "payment-history") {
            const value = reply.includes("55-60") ? "58" : reply.includes("45-54") ? "50" : reply.includes("30-44") ? "37" : reply.includes("15-29") ? "22" : "10";
            setCreditParams(prev => ({ ...prev, paymentHistoryRating: value }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "**Question 2 of 7** 💳\n\nWhat percentage of your **credit card limit** do you typically use each month?",
                    type: "quick-reply",
                    quickReplies: ["Under 30%", "30-50%", "50-75%", "Over 75%"]
                });
                setStage("credit-utilization");
            }, 300);
        }
        // Stage 6: Credit Utilization (30%)
        else if (stage === "credit-utilization") {
            const value = reply === "Under 30%" ? "25" : reply === "30-50%" ? "40" : reply === "50-75%" ? "60" : "85";
            setCreditParams(prev => ({ ...prev, creditUtilization: value }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "**Question 3 of 7** 📅\n\nHow many **years** have you held your oldest credit card or loan account?",
                    type: "quick-reply",
                    quickReplies: ["Under 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"]
                });
                setStage("credit-age");
            }, 300);
        }
        // Stage 7: Credit Age (15%)
        else if (stage === "credit-age") {
            const value = reply === "Under 1 year" ? "0" : reply === "1-3 years" ? "2" : reply === "3-5 years" ? "4" : reply === "5-10 years" ? "7" : "12";
            setCreditParams(prev => ({ ...prev, creditHistoryYears: value }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "**Question 4 of 7** 🏦\n\nHow many **active loans and credit cards** do you currently have?",
                    type: "quick-reply",
                    quickReplies: ["0", "1-2", "3-4", "5-6", "7+"]
                });
                setStage("credit-lines");
            }, 300);
        }
        // Stage 8: Credit Lines (10%)
        else if (stage === "credit-lines") {
            const value = reply === "0" ? "0" : reply === "1-2" ? "2" : reply === "3-4" ? "3" : reply === "5-6" ? "5" : "8";
            setCreditParams(prev => ({ ...prev, openCreditLines: value }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "**Question 5 of 7** 🔍\n\nHow many times have you **applied for new credit** in the last 6 months?",
                    type: "quick-reply",
                    quickReplies: ["0 times", "1 time", "2-3 times", "4-5 times", "6+ times"]
                });
                setStage("recent-inquiries");
            }, 300);
        }
        // Stage 9: Recent Inquiries (10%)
        else if (stage === "recent-inquiries") {
            const value = reply === "0 times" ? "0" : reply === "1 time" ? "1" : reply === "2-3 times" ? "2" : reply === "4-5 times" ? "4" : "7";
            setCreditParams(prev => ({ ...prev, recentInquiries: value }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "**Question 6 of 7** ⚠️\n\nHave you ever **filed for bankruptcy** in the past?",
                    type: "quick-reply",
                    quickReplies: ["No", "Yes"]
                });
                setStage("bankruptcy");
            }, 300);
        }
        // Stage 10: Bankruptcy (Penalty)
        else if (stage === "bankruptcy") {
            setCreditParams(prev => ({ ...prev, bankruptcyHistory: reply }));
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "**Question 7 of 7** ⚠️\n\nHave you ever **defaulted on** (failed to pay back) a loan completely?",
                    type: "quick-reply",
                    quickReplies: ["No", "Yes"]
                });
                setStage("defaults");
            }, 300);
        }
        // Stage 11: Defaults (Penalty) - Final step
        else if (stage === "defaults") {
            const finalParams = { ...creditParams, defaultsHistory: reply };
            setCreditParams(finalParams);
            setTimeout(() => {
                runCreditAnalysis(finalParams);
            }, 300);
        }
    };

    const handleFileUpload = async (file: File) => {
        addMessage({ role: "user", content: `📎 Uploaded: ${file.name}` });
        setStage("processing");

        addMessage({
            role: "assistant",
            content: "Analyzing your documents... I'm extracting financial insights and calculating your loan readiness score."
        });

        setIsLoading(true);

        // Simulate processing (in real app, this calls the backend)
        setTimeout(async () => {
            // Mock audit result (in real app, this comes from the API)
            const mockAuditData: AuditData = {
                healthScore: 72,
                redFlags: [
                    "DTI ratio of 48% is above the preferred 40% threshold",
                    "Irregular GST filing pattern detected",
                    "High cash withdrawals in last 3 months"
                ],
                strengths: [
                    "Consistent monthly revenue above ₹3 Lakh",
                    "No cheque bounces in the past 12 months",
                    "Business operational for 4+ years"
                ],
                summary: "Your profile shows moderate loan readiness. Address the high DTI ratio and GST filing gaps to improve your chances.",
                recommendedActions: [
                    "Clear small personal loan to reduce DTI by 15%",
                    "File pending GST returns for Q3",
                    "Maintain consistent bank balance for 2 months"
                ],
                radarData: [
                    { category: "Liquidity", value: 75, fullMark: 100 },
                    { category: "KYC", value: 90, fullMark: 100 },
                    { category: "Credit History", value: 65, fullMark: 100 },
                    { category: "Debt Ratio", value: 52, fullMark: 100 },
                    { category: "Stability", value: 80, fullMark: 100 },
                    { category: "Compliance", value: 60, fullMark: 100 }
                ]
            };

            setAuditData(mockAuditData);
            setStage("complete");
            setIsLoading(false);

            addMessage({
                role: "assistant",
                content: `✅ **Audit Complete!** Your Loan Readiness Score is **${mockAuditData.healthScore}/100**.\n\nI found ${mockAuditData.redFlags.length} areas needing attention and ${mockAuditData.strengths.length} strengths. Check the dashboard for the full breakdown.`
            });

            // Switch to dashboard tab on mobile
            setMobileTab("dashboard");
        }, 3000);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        addMessage({ role: "user", content: userMessage });
        setInputValue("");

        // If audit complete, enable Q&A with context
        if (stage === "complete" && auditData) {
            setIsLoading(true);
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: messages.map(m => ({ role: m.role, content: m.content })).concat([
                            { role: "user", content: userMessage }
                        ]),
                        loanId: 1
                    })
                });

                if (!response.ok) throw new Error("Chat failed");

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let assistantContent = "";

                const assistantMsg: Message = {
                    id: `msg-${Date.now()}`,
                    role: "assistant",
                    content: ""
                };

                setMessages(prev => [...prev, assistantMsg]);

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        assistantContent += decoder.decode(value, { stream: true });
                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
                            return updated;
                        });
                    }
                }
            } catch (error) {
                console.error("Chat error:", error);
                addMessage({ role: "assistant", content: "I encountered an error. Please try again." });
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Render the chat panel - memoized to prevent re-renders
    const chatPanel = useMemo(() => (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-[#1F1E1D]">
            {/* Chat Header - Claude Style */}
            <div className="flex items-center gap-3 p-4 border-b border-[#E5E5E5] dark:border-[#30302E] bg-white dark:bg-[#2B2A29]">
                <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white shadow-sm">
                        <Bot className="h-4 w-4" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-[#2B2A29]" />
                </div>
                <div>
                    <h3 className="font-semibold text-[15px] text-[#1F1E1D] dark:text-[#ECECEC]">CreditSetu AI</h3>
                    <p className="text-xs font-medium text-green-600 dark:text-green-500">
                        {isLoading ? "Analyzing..." : "Online"}
                    </p>
                </div>
            </div>

            {/* Messages - Claude Style */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <Avatar className={cn(
                            "h-8 w-8 mt-1 flex-shrink-0 border",
                            msg.role === 'assistant'
                                ? "border-[#E5E5E5] dark:border-[#404040]"
                                : "border-transparent"
                        )}>
                            {msg.role === 'assistant' ? (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white">
                                    <Bot className="h-4 w-4" />
                                </div>
                            ) : (
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="space-y-2 max-w-[85%]">
                            <div className={cn(
                                "rounded-2xl p-3.5 text-[14px] leading-relaxed",
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-md shadow-sm'
                                    : 'bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] rounded-tl-md shadow-sm'
                            )}>
                                {msg.role === 'assistant' ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[14px] prose-strong:text-[#1F1E1D] dark:prose-strong:text-[#ECECEC]">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <span className="text-[14px]">{msg.content}</span>
                                )}
                            </div>

                            {/* Quick Reply Pills - Claude Style */}
                            {msg.type === "quick-reply" && msg.quickReplies && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {msg.quickReplies.map((reply, i) => (
                                        <motion.button
                                            key={i}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-4 py-2 text-[13px] font-medium rounded-full bg-white dark:bg-[#30302E] border border-[#E5E5E5] dark:border-[#404040] text-[#1F1E1D] dark:text-[#ECECEC] hover:border-[#D46B4F] hover:text-[#D46B4F] transition-colors shadow-sm"
                                            onClick={() => handleQuickReply(reply)}
                                        >
                                            {reply}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Loading indicator - Claude Style */}
                {isLoading && (
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1 border border-[#E5E5E5] dark:border-[#404040] flex-shrink-0">
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white">
                                <Bot className="h-4 w-4" />
                            </div>
                        </Avatar>
                        <div className="rounded-2xl rounded-tl-md p-3.5 bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] shadow-sm">
                            <div className="flex items-center gap-2 text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
                                <Loader2 className="h-4 w-4 animate-spin text-[#D46B4F]" />
                                {stage === "processing" ? "Analyzing documents..." : "Thinking..."}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Claude-style Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-[#2B2A29] border-t border-[#E5E5E5] dark:border-[#30302E]">
                <div className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#E5E5E5] dark:border-[#404040]
                    bg-[#FAFAF8] dark:bg-[#1F1E1D]
                    shadow-[0_0_15px_rgba(0,0,0,0.04)] hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]
                    focus-within:shadow-[0_0_25px_rgba(0,0,0,0.1)] focus-within:border-[#D46B4F]/40
                    transition-all duration-200
                `}>
                    <input
                        type="text"
                        placeholder={stage === "complete" ? "Ask me anything about your credit score..." : "Type a message..."}
                        className="flex-1 bg-transparent border-0 outline-none text-[15px] text-[#1F1E1D] dark:text-[#ECECEC] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] py-1.5"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading || (stage !== "complete" && stage !== "loan-amount")}
                    />
                    <button
                        type="submit"
                        className={`
                            h-8 w-8 rounded-xl shrink-0 flex items-center justify-center transition-all duration-200
                            ${inputValue.trim() && !isLoading
                                ? 'bg-[#D46B4F] text-white hover:bg-[#C45A3E] shadow-md active:scale-95'
                                : 'bg-[#E5E5E5] dark:bg-[#404040] text-[#9CA3AF] cursor-not-allowed'}
                        `}
                        disabled={!inputValue.trim() || isLoading}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-center text-[11px] text-[#9CA3AF] dark:text-[#6B7280] mt-3">
                    Powered by CreditSetu AI • Results are indicative only
                </p>
            </form>
        </div>
    ), [messages, isLoading, inputValue, stage]);

    // Render the dashboard panel - memoized to prevent re-renders
    const dashboardPanel = useMemo(() => (
        <div className="h-full p-6 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
            <AnimatePresence mode="wait">
                {!auditData ? (
                    // Empty State
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 blur-3xl rounded-full" />
                            <div className="relative p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 shadow-xl">
                                <BarChart3 className="h-16 w-16 text-primary/40 mx-auto mb-4" />
                                <h3 className="font-serif text-xl font-bold text-slate-700 dark:text-slate-300">
                                    Waiting for Analysis
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                                    Complete the chat onboarding to see your personalized loan readiness dashboard.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // Audit Dashboard
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Your Readiness Scorecard
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                AI-powered analysis based on your financial documents
                            </p>
                        </motion.div>

                        {/* Charts Row */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Health Gauge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/30">
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-4">Health Score</h3>
                                    <HealthGauge score={auditData.healthScore} />
                                </Card>
                            </motion.div>

                            {/* Readiness Radar */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/30">
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-4">Readiness Radar</h3>
                                    <ReadinessRadar data={auditData.radarData} />
                                </Card>
                            </motion.div>
                        </div>

                        {/* Gap Feed */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <GapFeed
                                redFlags={auditData.redFlags}
                                strengths={auditData.strengths}
                                recommendedActions={auditData.recommendedActions}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    ), [auditData]);

    return (
        <>
            {/* Desktop Split View */}
            <div className="hidden lg:flex h-[calc(100vh-4rem)] gap-0">
                {/* Left Panel - Chat (40%) */}
                <div className="w-[40%] border-r border-border/50">
                    {chatPanel}
                </div>
                {/* Right Panel - Dashboard (60%) */}
                <div className="w-[60%]">
                    {dashboardPanel}
                </div>
            </div>

            {/* Mobile Tabbed View */}
            <div className="lg:hidden">
                <Tabs value={mobileTab} onValueChange={(v: string) => setMobileTab(v as "chat" | "dashboard")}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="chat" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat
                        </TabsTrigger>
                        <TabsTrigger value="dashboard" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Dashboard
                            {auditData && (
                                <span className="ml-1 h-2 w-2 rounded-full bg-green-500" />
                            )}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="chat" className="h-[calc(100vh-10rem)]">
                        {chatPanel}
                    </TabsContent>
                    <TabsContent value="dashboard" className="h-[calc(100vh-10rem)]">
                        {dashboardPanel}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
