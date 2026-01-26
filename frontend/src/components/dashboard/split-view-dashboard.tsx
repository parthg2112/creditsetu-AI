"use client";

import { useState, useRef, useEffect, useCallback, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Loader2, Sparkles, MessageSquare, BarChart3, Mic, Trash2, Landmark, TrendingUp, FileText, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { Component as RadarChart, chartBackground } from "@/components/ui/radar-chart";
import { AnimatedRadialChart } from "@/components/ui/animated-radial-chart";
import { WormLoader } from "@/components/ui/worm-loader";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { ClaudeChatInput } from "@/components/ui/claude-style-chat-input";
import { useSession } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Chat message type
interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    type?: "text" | "quick-reply";
    quickReplies?: string[];
    is_rbi_verified?: boolean;
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [stage, setStage] = useState<OnboardingStage>("loan-amount");
    const [auditData, setAuditData] = useState<AuditData | null>(null);
    const [creditParams, setCreditParams] = useState<CreditParams>(INITIAL_PARAMS);
    const [mobileTab, setMobileTab] = useState<"chat" | "dashboard">("chat");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [reportUrl, setReportUrl] = useState<string | null>(null);

    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

    // Resizable panel state
    const [leftPanelWidth, setLeftPanelWidth] = useState(35); // percentage
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Global Language State
    const { language, t } = useLanguage();
    const { data: session, status } = useSession();

    const hasInitialized = useRef(false);

    // Initialize Chat Session
    useEffect(() => {
        const initChat = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;

            try {
                const headers: HeadersInit = {};
                if (session?.user?.email) {
                    headers['X-User-Email'] = session.user.email;
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}/chat/init?language=${language}`, {
                    method: 'POST',
                    headers
                });
                const data = await response.json();
                setSessionId(data.session_id);
                setSuggestedQuestions(data.suggested_questions || []);

                if (data.chat_history && data.chat_history.length > 0) {
                    setMessages(data.chat_history.map((msg: any) => ({
                        ...msg,
                        id: `hist-${Date.now()}-${Math.random()}`
                    })));
                } else {
                    addMessage({
                        role: "assistant",
                        content: data.message
                    });
                }
            } catch (error) {
                console.error("Failed to initialize chat session:", error);
                // Fallback message if backend is down
                addMessage({
                    role: "assistant",
                    content: "Hello! I am your AI Loan Consultant. I'm currently having trouble connecting to my brain, but I'll try to help anyway. Shall we start with your Annual Income?"
                });
            }
        };

        if (status !== "loading" && !sessionId) {
            initChat();
        }
    }, [status, session, language]);



    // Ref for the scroll anchor at the bottom of messages
    const scrollAnchorRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change or loading state changes
    useEffect(() => {
        const scrollToBottom = () => {
            // Method 1: Use scrollIntoView on anchor (most reliable)
            if (scrollAnchorRef.current) {
                scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            // Method 2: Fallback to scrollTop manipulation
            else if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        };

        // Multiple scroll attempts to handle animation delays
        const timeouts = [
            setTimeout(scrollToBottom, 0),
            setTimeout(scrollToBottom, 100),
            setTimeout(scrollToBottom, 300),
        ];

        return () => timeouts.forEach(clearTimeout);
    }, [messages, isLoading, messages.length]);

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

    // Voice Recording Functions
    const sendAudioToBackend = useCallback(async (audioBlob: Blob) => {
        if (!sessionId) return;
        setIsLoading(true);

        // Optimistic update with temp ID
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            role: "user",
            content: t('listening') + " 🎤"
        }]);

        const formData = new FormData();
        formData.append("session_id", sessionId);
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", language);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}/chat/voice`, {
                method: "POST",
                body: formData,
                headers: session?.user?.email ? { 'X-User-Email': session.user.email } : undefined
            });
            const data = await response.json();

            // Update user message with transcription
            if (data.user_transcription) {
                setMessages(prev => prev.map(msg =>
                    msg.id === tempId ? { ...msg, content: data.user_transcription } : msg
                ));
            } else {
                // Fallback if no transcription
                setMessages(prev => prev.map(msg =>
                    msg.id === tempId ? { ...msg, content: t('voice_message') } : msg
                ));
            }

            // Handle Response
            addMessage({
                role: "assistant",
                content: data.response_text,
                is_rbi_verified: data.is_rbi_verified
            });

            if (data.chart_data?.type === "audit_complete") {
                const audit = data.chart_data.data;
                setAuditData({
                    healthScore: audit.healthScore,
                    status: "ready",
                    redFlags: audit.redFlags,
                    strengths: audit.strengths,
                    summary: audit.summary,
                    recommendedActions: audit.recommendedActions,
                    radarData: audit.radarData
                });
                setMobileTab("dashboard");
            }

            if (data.report_url) {
                const fullUrl = `${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}${data.report_url}`;
                setReportUrl(fullUrl);
            }
        } catch (error) {
            console.error("Error sending audio to backend:", error);
            // Remove temp message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            addMessage({ role: "system", content: "Voice processing failed. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, language, t, session]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                await sendAudioToBackend(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    }, [sendAudioToBackend]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
    }, [isRecording]);

    const sendMessageToBackend = async (text: string) => {
        if (!sessionId) return;
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("session_id", sessionId);
            formData.append("text_input", text);
            formData.append("language", language);

            const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
            console.log("Connecting to Backend:", backendUrl);

            const response = await fetch(`${backendUrl}/chat/voice`, {
                method: "POST",
                body: formData,
                headers: session?.user?.email ? { 'X-User-Email': session.user.email } : undefined
            });

            const data = await response.json();

            // Add Assistant Message
            addMessage({
                role: "assistant",
                content: data.response_text,
                is_rbi_verified: data.is_rbi_verified
            });

            // Handle Chart Data
            if (data.chart_data) {
                // Determine if we need to switch to dashboard to show result
                if (data.chart_data.type === "audit_complete") {
                    const audit = data.chart_data.data;
                    setAuditData({
                        healthScore: audit.healthScore,
                        status: "ready",
                        redFlags: audit.redFlags,
                        strengths: audit.strengths,
                        summary: audit.summary,
                        recommendedActions: audit.recommendedActions,
                        radarData: audit.radarData
                    });
                    setMobileTab("dashboard");
                }
            }

            // Handle Report URL
            if (data.report_url) {
                const fullUrl = `${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}${data.report_url}`;
                setReportUrl(fullUrl);
                addMessage({
                    role: "system",
                    content: `📄 **Report Ready!**\n\nYour detailed Loan Readiness Report has been generated. You can download it below. [Download PDF](${fullUrl})`
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

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        addMessage({ role: "user", content: text });
        await sendMessageToBackend(text);
    };

    // Dynamic Status Message
    const getStatusMessage = () => {
        if (isRecording) return t('listening');
        if (isLoading) {
            if (stage === "processing") return t('analyzing');
            if (stage === "annual-income") return t('verifying_income');
            if (stage === "loan-amount") return t('checking_eligibility');
            return t('thinking');
        }
        if (stage === "complete") return t('audit_complete');
        if (messages.length === 0) return t('ready_to_help');
        return t('waiting_for_input');
    };

    const handleClearChat = useCallback(async () => {
        setIsLoading(true);
        try {
            if (sessionId) {
                const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
                await fetch(`${backendUrl}/chat/clear/${sessionId}`, {
                    method: 'POST'
                });
            }

            // Reset local state
            setMessages([{
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: "Welcome to CreditSetu AI", // Trigger the special welcome UI
                type: "quick-reply",
                quickReplies: ["1", "2", "3", "4"]
            }]);
            setCreditParams(INITIAL_PARAMS);
            setAuditData(null);
            setStage("loan-amount");

        } catch (error) {
            console.error("Failed to clear chat:", error);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    // Render the chat panel - memoized to prevent re-renders
    const chatPanel = useMemo(() => (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-[#1F1E1D]">
            {/* Chat Header - Claude Style */}
            <div className="flex items-center gap-3 p-4 border-b border-[#E5E5E5] dark:border-[#30302E] bg-white dark:bg-[#2B2A29]">
                <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white shadow-sm">
                        <Star className="h-5 w-5 fill-current" />
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#2B2A29] ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                </div>
                <div>
                    <h3 className="font-semibold text-[15px] text-[#1F1E1D] dark:text-[#ECECEC]">CreditSetu AI</h3>
                    <p className="text-xs font-medium text-muted-foreground">
                        {getStatusMessage()}
                    </p>
                </div>
                <div className="ml-auto">
                    <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#D46B4F] hover:text-[#C45A3E] hover:bg-[#FDF4F0]"
                                title="Clear Chat"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Clear Chat History?</DialogTitle>
                                <DialogDescription>
                                    This will remove all messages from the current session. This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-2 sm:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsClearDialogOpen(false)}
                                    className="border-[#E5E5E5] text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        handleClearChat();
                                        setIsClearDialogOpen(false);
                                    }}
                                    className="bg-[#D46B4F] hover:bg-[#C45A3E] text-white"
                                >
                                    Confirm Clear
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Messages - Claude Style */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
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
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white rounded-full">
                                    <Star className="h-4 w-4 fill-current" />
                                </div>
                            ) : (
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {session?.user?.image ? (
                                        <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                                    ) : (
                                        "U"
                                    )}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="space-y-2 max-w-[85%]">
                            <div className={cn(
                                "rounded-2xl p-4 text-[15px] leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] rounded-tl-sm'
                            )}>
                                {msg.role === 'assistant' ? (
                                    msg.content.includes("Welcome to CreditSetu AI") ? (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-semibold text-[#1F1E1D] dark:text-[#ECECEC]">{t('welcome_message')}</span>

                                            </div>
                                            <p className="text-muted-foreground">{t('ai_intro')}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                                {[
                                                    { icon: Landmark, label: t('check_eligibility'), cmd: "1" },
                                                    { icon: TrendingUp, label: t('improve_score'), cmd: "2" },
                                                    { icon: FileText, label: t('document_checklist'), cmd: "3" },
                                                    { icon: ShieldCheck, label: t('full_audit'), cmd: "4" }
                                                ].map((opt) => (
                                                    <motion.button
                                                        key={opt.cmd}
                                                        onClick={() => handleSendMessage(opt.cmd)}
                                                        whileHover={{ scale: 1.03, y: -2, backgroundColor: "#FFF9F5" }}
                                                        whileTap={{ scale: 0.97 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#30302E] border border-[#E5E5E5] dark:border-[#404040] hover:border-[#D46B4F]/30 transition-colors text-left group shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#FDF4F0] dark:bg-[#3E241A] text-[#D46B4F] group-hover:bg-[#FFEDD5] transition-colors">
                                                            <opt.icon className="h-5 w-5" />
                                                        </div>
                                                        <span className="text-sm font-medium text-[#1F1E1D] dark:text-[#ECECEC] group-hover:text-[#D46B4F] transition-colors">{opt.label}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] prose-strong:text-[#1F1E1D] dark:prose-strong:text-[#ECECEC]">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    )
                                ) : msg.role === 'system' ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-[#D46B4F] font-medium border-b border-dashed border-[#D46B4F]/30 pb-2">
                                            <Sparkles className="h-4 w-4" />
                                            <span>{t('report_ready')}</span>
                                        </div>
                                        <p className="text-muted-foreground">{msg.content.replace(/\[Download PDF\]\(.*\)/, '')}</p>
                                        {reportUrl && (
                                            <Button
                                                onClick={() => window.open(reportUrl, '_blank')}
                                                className="mt-1 bg-[#3D4F6F] hover:bg-[#2A3B52] text-white w-full flex items-center justify-center gap-2 h-10 rounded-xl"
                                            >
                                                <BarChart3 className="h-4 w-4" />
                                                {t('download_pdf')}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[15px]">{msg.content}</span>
                                )}

                                {/* RBI Verification Badge */}
                                {msg.is_rbi_verified && (
                                    <div className="mt-3 pt-2 border-t border-[#E5E5E5] dark:border-[#404040] flex items-center gap-1.5">
                                        <div className="h-4 w-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-green-600 dark:text-green-400">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        </div>
                                        <span className="text-[11px] font-medium text-green-700 dark:text-green-400">
                                            Verified Source: Official Guidelines
                                        </span>
                                    </div>
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
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white rounded-full">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </Avatar>
                        <div className="rounded-2xl rounded-tl-sm p-4 bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] shadow-sm">
                            <div className="flex items-center gap-2 text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
                                <Loader2 className="h-4 w-4 animate-spin text-[#D46B4F]" />
                                {getStatusMessage()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Scroll anchor - always at bottom for reliable auto-scroll */}
                <div ref={scrollAnchorRef} className="h-0 w-0" aria-hidden="true" />
            </div>

            {/* Claude-style Input */}
            <div className="p-4 bg-white dark:bg-[#2B2A29] border-t border-[#E5E5E5] dark:border-[#30302E]">
                <ClaudeChatInput
                    onSendMessage={({ message }) => handleSendMessage(message)}
                    placeholder={t('how_can_i_help')}
                    onMicClick={() => {
                        if (language !== 'en') {
                            alert(t('voice_only_english'));
                            return;
                        }
                        if (isRecording) {
                            stopRecording();
                        } else {
                            startRecording();
                        }
                    }}
                    isRecording={isRecording}
                />
            </div>
        </div>
    ), [messages, isLoading, stage, language, isRecording, startRecording, stopRecording, handleQuickReply, reportUrl, t, session, handleClearChat]);


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
                            <div className="relative p-10 rounded-3xl">
                                <WormLoader />
                                <h3 className="font-serif text-xl font-bold text-[#3D4F6F] dark:text-slate-200 mt-6">
                                    {t('thinking')}
                                </h3>
                                <p className="text-sm text-[#6B7280] mt-3 max-w-xs mx-auto">
                                    {t('online')}
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
                                {t('your_readiness_scorecard')}
                            </h2>
                            <p className="text-[#6B7280] mt-1">
                                AI-powered analysis based on your financial profile
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Health Score - Animated Radial Chart */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="h-full"
                            >
                                <Card className="p-6 bg-gradient-to-br from-[#3D4F6F] to-[#2A3B52] border-0 shadow-xl h-full flex flex-col justify-center">
                                    <h3 className="font-semibold text-sm text-white/70 mb-2">Health Score</h3>
                                    <div className="flex justify-center items-center py-4">
                                        <AnimatedRadialChart
                                            value={auditData.healthScore}
                                            size={220}
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
                                className="h-full"
                            >
                                <Card className="p-6 bg-white dark:bg-[#2B2A29] border border-[#E5E5E5] dark:border-[#30302E] shadow-md h-full flex flex-col justify-center">
                                    <h3 className="font-semibold text-sm text-[#3D4F6F] dark:text-slate-300 mb-4">Readiness Factors</h3>
                                    <div className="flex justify-center items-center">
                                        <RadarChart
                                            width={220}
                                            height={220}
                                            data={auditData.radarData}
                                            getValue={(d) => d.frequency}
                                        />
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

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
                                <Card className="p-5 bg-[#FFF4F0] dark:bg-orange-900/10 border border-[#E8D4D0] dark:border-orange-800/30 shadow-sm">
                                    <h3 className="font-semibold text-sm text-[#8A5A55] dark:text-orange-400 mb-3">⚠️ Areas of Concern</h3>
                                    <ul className="space-y-2">
                                        {auditData.redFlags.map((flag, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-[#8A5A55] dark:text-orange-400">
                                                <span className="text-orange-500 mt-0.5">•</span>
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}

                            {/* Strengths */}
                            {auditData.strengths.length > 0 && (
                                <Card className="p-5 bg-[#F4F7F4] dark:bg-green-900/10 border border-[#D8E2DC] dark:border-green-800/30 shadow-sm">
                                    <h3 className="font-semibold text-sm text-[#4A6A56] dark:text-green-400 mb-3">✅ Strengths</h3>
                                    <ul className="space-y-2">
                                        {auditData.strengths.map((strength, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-[#4A6A56] dark:text-green-400">
                                                <span className="text-green-600 mt-0.5">•</span>
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

    // Resize handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // Limit between 25% and 60%
        setLeftPanelWidth(Math.min(60, Math.max(25, newWidth)));
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Attach global mouse events for resizing
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
        <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
            {/* Desktop Split View */}
            <div
                ref={containerRef}
                className="hidden lg:flex h-full w-full"
            >
                {/* Left Panel - Chat */}
                <div
                    className="h-full overflow-hidden flex-shrink-0"
                    style={{ width: `${leftPanelWidth}%` }}
                >
                    {chatPanel}
                </div>

                {/* Resizable Divider */}
                <div
                    className={`
                        w-1 h-full cursor-col-resize flex-shrink-0
                        bg-border hover:bg-primary/30 active:bg-primary/50
                        transition-colors duration-150
                        flex items-center justify-center
                        group
                    `}
                    onMouseDown={handleMouseDown}
                >
                    <div className="w-0.5 h-8 bg-muted-foreground/30 rounded-full group-hover:bg-primary/50 transition-colors" />
                </div>

                {/* Right Panel - Dashboard */}
                <div
                    className="h-full overflow-hidden flex-1"
                >
                    {dashboardPanel}
                </div>
            </div>

            {/* Mobile Tabbed View */}
            <div className="lg:hidden h-full">
                <Tabs value={mobileTab} onValueChange={(v: string) => setMobileTab(v as "chat" | "dashboard")} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
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
                    <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
                        {chatPanel}
                    </TabsContent>
                    <TabsContent value="dashboard" className="flex-1 overflow-hidden mt-0">
                        {dashboardPanel}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
