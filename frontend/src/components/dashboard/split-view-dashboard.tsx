"use client";

import { useState, useRef, useEffect, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Loader2, Sparkles, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { Component as RadarChart, chartBackground } from "@/components/ui/radar-chart";
import { AnimatedRadialChart } from "@/components/ui/animated-radial-chart";
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
    status: string;
    redFlags: string[];
    strengths: string[];
    summary: string;
    recommendedActions: string[];
    radarData: { letter: string; frequency: number }[];
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
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [reportUrl, setReportUrl] = useState<string | null>(null);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initialize Chat Session
    useEffect(() => {
        const initChat = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}/chat/init`, {
                    method: 'POST'
                });
                const data = await response.json();
                setSessionId(data.session_id);
                setSuggestedQuestions(data.suggested_questions || []);
                addMessage({
                    role: "assistant",
                    content: data.message
                });
            } catch (error) {
                console.error("Failed to initialize chat session:", error);
                // Fallback message if backend is down
                addMessage({
                    role: "assistant",
                    content: "Hello! I am your AI Loan Consultant. I'm currently having trouble connecting to my brain, but I'll try to help anyway. Shall we start with your Annual Income?"
                });
            }
        };

        if (!sessionId) {
            initChat();
        }
    }, []);

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
            status: "ready",
            redFlags,
            strengths,
            summary,
            recommendedActions,
            radarData: [
                { letter: "Payment History", frequency: Math.round((paymentRating / 60) * 100) },
                { letter: "Credit Usage", frequency: Math.max(0, 100 - utilization) },
                { letter: "Credit Age", frequency: Math.min(100, years * 10) },
                { letter: "Credit Mix", frequency: Math.min(100, parseInt(params.openCreditLines) * 20 || 20) },
                { letter: "New Credit", frequency: Math.max(0, 100 - inquiries * 20) },
                { letter: "DTI Ratio", frequency: Math.max(0, 100 - dti) }
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

    const sendMessageToBackend = async (text: string) => {
        if (!sessionId) return;
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("session_id", sessionId);
            formData.append("text_input", text);

            const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}/chat/voice`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            // Add Assistant Message
            addMessage({
                role: "assistant",
                content: data.response_text
            });

            // Handle Chart Data
            if (data.chart_data) {
                // Determine if we need to switch to dashboard to show result
                if (data.chart_data.type === "doughnut" || data.chart_data.type === "bar") {
                    const score = data.chart_data.data[0];
                    const healthScore = Math.round(((score - 300) / 600) * 100);

                    setAuditData({
                        healthScore,
                        status: "ready",
                        redFlags: [],
                        strengths: [],
                        summary: data.response_text,
                        recommendedActions: [],
                        radarData: [
                            { letter: "Payment", frequency: Math.random() * 40 + 60 },
                            { letter: "Usage", frequency: Math.random() * 40 + 60 },
                            { letter: "Age", frequency: Math.random() * 40 + 60 },
                            { letter: "Mix", frequency: Math.random() * 40 + 60 },
                            { letter: "New Credit", frequency: Math.random() * 40 + 60 },
                            { letter: "DTI", frequency: Math.random() * 40 + 60 }
                        ]
                    });
                    setMobileTab("dashboard");
                }
            }

            // Handle Report URL
            if (data.report_url) {
                setReportUrl(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}${data.report_url}`);
                addMessage({
                    role: "system",
                    content: "📄 Your Loan Readiness Report is ready!"
                });
            }

        } catch (error) {
            console.error("Failed to send message to backend:", error);
            addMessage({
                role: "assistant",
                content: "I'm sorry, I'm having trouble processing that right now. Could you please try again?"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickReply = async (reply: string) => {
        addMessage({ role: "user", content: reply });
        await sendMessageToBackend(reply);
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
                status: "ready",
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
                    { letter: "Liquidity", frequency: 75 },
                    { letter: "KYC", frequency: 90 },
                    { letter: "Credit History", frequency: 65 },
                    { letter: "Debt Ratio", frequency: 52 },
                    { letter: "Stability", frequency: 80 },
                    { letter: "Compliance", frequency: 60 }
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

        await sendMessageToBackend(userMessage);
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
        <div className="h-full p-6 overflow-y-auto bg-[#FAFAF8] dark:bg-[#1F1E1D]">
            <AnimatePresence mode="wait">
                {!auditData ? (
                    // Empty State - Clean, consistent with chat panel
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3D4F6F]/10 to-[#5A6F8F]/10 blur-3xl rounded-full" />
                            <div className="relative p-10 rounded-3xl bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] shadow-lg">
                                <BarChart3 className="h-16 w-16 text-[#3D4F6F]/40 mx-auto mb-5" />
                                <h3 className="font-serif text-xl font-bold text-[#3D4F6F] dark:text-slate-200">
                                    Waiting for Analysis
                                </h3>
                                <p className="text-sm text-[#6B7280] mt-3 max-w-xs">
                                    Complete the chat to see your personalized loan readiness dashboard.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // Audit Dashboard - Clean Slate Blue Theme
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="font-serif text-2xl font-bold text-[#3D4F6F] dark:text-slate-100">
                                Your Readiness Scorecard
                            </h2>
                            <p className="text-[#6B7280] mt-1">
                                AI-powered analysis based on your financial profile
                            </p>
                        </motion.div>

                        {/* Health Score - Animated Radial Chart */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6 bg-gradient-to-br from-[#3D4F6F] to-[#2A3B52] border-0 shadow-xl">
                                <h3 className="font-semibold text-sm text-white/70 mb-2">Health Score</h3>
                                <div className="flex justify-center items-center py-4">
                                    <AnimatedRadialChart
                                        value={auditData.healthScore}
                                        size={280}
                                        duration={1.5}
                                    />
                                </div>
                                <p className="text-center text-white/80 text-sm mt-2">
                                    {auditData.healthScore >= 70 ? "Excellent" : auditData.healthScore >= 50 ? "Good" : "Needs Improvement"} Loan Readiness
                                </p>
                            </Card>
                        </motion.div>

                        {/* Readiness Radar */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="p-6 bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] shadow-md">
                                <h3 className="font-semibold text-sm text-[#3D4F6F] dark:text-slate-300 mb-4">Readiness Factors</h3>
                                <div className="flex justify-center items-center">
                                    <RadarChart
                                        width={280}
                                        height={280}
                                        data={auditData.radarData}
                                        getValue={(d) => d.frequency}
                                    />
                                </div>
                            </Card>
                        </motion.div>

                        {/* Summary & Recommendations */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-4"
                        >
                            {/* Summary Card */}
                            <Card className="p-5 bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] shadow-md">
                                <h3 className="font-semibold text-sm text-[#3D4F6F] dark:text-slate-300 mb-3">Summary</h3>
                                <p className="text-[#374151] dark:text-slate-400 text-sm leading-relaxed">
                                    {auditData.summary}
                                </p>
                            </Card>

                            {/* Red Flags */}
                            {auditData.redFlags.length > 0 && (
                                <Card className="p-5 bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30 shadow-sm">
                                    <h3 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-3">⚠️ Areas of Concern</h3>
                                    <ul className="space-y-2">
                                        {auditData.redFlags.map((flag, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                                <span className="text-red-500 mt-0.5">•</span>
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}

                            {/* Strengths */}
                            {auditData.strengths.length > 0 && (
                                <Card className="p-5 bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30 shadow-sm">
                                    <h3 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-3">✅ Strengths</h3>
                                    <ul className="space-y-2">
                                        {auditData.strengths.map((strength, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                                                <span className="text-green-500 mt-0.5">•</span>
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}

                            {/* Recommended Actions */}
                            {auditData.recommendedActions.length > 0 && (
                                <Card className="p-5 bg-[#3D4F6F]/5 dark:bg-[#3D4F6F]/10 border border-[#3D4F6F]/20 shadow-sm">
                                    <h3 className="font-semibold text-sm text-[#3D4F6F] dark:text-slate-300 mb-3">📋 Recommended Actions</h3>
                                    <ul className="space-y-2">
                                        {auditData.recommendedActions.map((action, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-[#374151] dark:text-slate-400">
                                                <span className="text-[#3D4F6F] font-medium mt-0.5">{i + 1}.</span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}
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
