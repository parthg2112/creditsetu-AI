"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/contexts/language-context";

// Types
export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    type?: "text" | "quick-reply";
    quickReplies?: string[];
}

export interface AuditData {
    healthScore: number;
    status: string;
    redFlags: string[];
    strengths: string[];
    summary: string;
    recommendedActions: string[];
    radarData: { letter: string; frequency: number }[];
}

interface UseChatSessionOptions {
    onAuditComplete?: (audit: AuditData) => void;
}

export function useChatSession(options?: UseChatSessionOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [reportUrl, setReportUrl] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const hasInitialized = useRef(false);
    const { language, t } = useLanguage();

    const { data: session } = useSession();
    const userEmail = session?.user?.email || "";

    // Add a message to the chat
    const addMessage = useCallback((msg: Omit<Message, "id">) => {
        const uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setMessages(prev => [...prev, { ...msg, id: uniqueId }]);
    }, []);

    // Initialize chat session
    useEffect(() => {
        const initChat = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;

            const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

            try {
                const response = await fetch(`${backendUrl}/chat/init?language=${language}`, {
                    method: 'POST',
                    headers: {
                        "X-User-Email": userEmail
                    }
                });
                const data = await response.json();
                setSessionId(data.session_id);
                setSuggestedQuestions(data.suggested_questions || []);

                // If history returned, set it
                if (data.chat_history && data.chat_history.length > 0) {
                    setMessages(data.chat_history.map((msg: any) => ({
                        id: `hist-${Math.random()}`,
                        role: msg.role,
                        content: msg.content
                    })));
                } else {
                    addMessage({
                        role: "assistant",
                        content: data.message
                    });
                }
            } catch (error) {
                console.error("Failed to initialize chat session:", error);
                addMessage({
                    role: "assistant",
                    content: "Hello! I am your AI Loan Consultant. I'm having trouble connecting to my brain, but I'll try to help anyway."
                });
            }
        };

        if (!sessionId) {
            initChat();
        }
    }, [sessionId, language, addMessage, userEmail]);

    // Send text message to backend
    const sendMessage = useCallback(async (text: string) => {
        if (!sessionId || !text.trim()) return;

        setIsLoading(true);
        addMessage({ role: "user", content: text });

        const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

        try {
            const formData = new FormData();
            formData.append("session_id", sessionId);
            formData.append("text_input", text);
            formData.append("language", language);

            const response = await fetch(`${backendUrl}/chat/voice`, {
                method: "POST",
                body: formData,
                headers: {
                    "X-User-Email": userEmail
                }
            });

            const data = await response.json();

            // Add assistant response
            addMessage({
                role: "assistant",
                content: data.response_text
            });

            // Handle audio URL (new format)
            if (data.audio_url) {
                setAudioUrl(`${backendUrl}${data.audio_url}`);
            }

            // Handle chart/audit data
            if (data.chart_data?.type === "audit_complete") {
                const audit: AuditData = {
                    healthScore: data.chart_data.data.healthScore,
                    status: "ready",
                    redFlags: data.chart_data.data.redFlags,
                    strengths: data.chart_data.data.strengths,
                    summary: data.chart_data.data.summary,
                    recommendedActions: data.chart_data.data.recommendedActions,
                    radarData: data.chart_data.data.radarData
                };
                options?.onAuditComplete?.(audit);
            }

            // Handle report URL
            if (data.report_url) {
                const fullUrl = `${backendUrl}${data.report_url}`;
                setReportUrl(fullUrl);
                addMessage({
                    role: "system",
                    content: `📄 **Report Ready!** Your detailed Loan Readiness Report has been generated.`
                });
            }

        } catch (error) {
            console.error("Failed to send message:", error);
            addMessage({
                role: "assistant",
                content: "I'm sorry, I'm having trouble processing that. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, language, addMessage, options, userEmail]);

    // Send audio to backend
    const sendAudio = useCallback(async (audioBlob: Blob) => {
        if (!sessionId) return;

        setIsLoading(true);
        addMessage({ role: "user", content: t('voice_message') || "🎤 Voice message" });

        const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

        try {
            const formData = new FormData();
            formData.append("session_id", sessionId);
            formData.append("audio", audioBlob, "recording.webm");
            formData.append("language", language);

            const response = await fetch(`${backendUrl}/chat/voice`, {
                method: "POST",
                body: formData,
                headers: {
                    "X-User-Email": userEmail
                }
            });

            const data = await response.json();

            addMessage({ role: "assistant", content: data.response_text });

            if (data.chart_data?.type === "audit_complete") {
                const audit: AuditData = {
                    healthScore: data.chart_data.data.healthScore,
                    status: "ready",
                    redFlags: data.chart_data.data.redFlags,
                    strengths: data.chart_data.data.strengths,
                    summary: data.chart_data.data.summary,
                    recommendedActions: data.chart_data.data.recommendedActions,
                    radarData: data.chart_data.data.radarData
                };
                options?.onAuditComplete?.(audit);
            }

            if (data.report_url) {
                const fullUrl = `${backendUrl}${data.report_url}`;
                setReportUrl(fullUrl);
            }

        } catch (error) {
            console.error("Error sending audio:", error);
            addMessage({ role: "system", content: "Voice processing failed. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, language, addMessage, t, options, userEmail]);

    // Start voice recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                await sendAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    }, [sendAudio]);

    // Stop voice recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    }, [isRecording]);

    return {
        // State
        messages,
        isLoading,
        sessionId,
        suggestedQuestions,
        reportUrl,
        audioUrl,
        isRecording,

        // Actions
        sendMessage,
        addMessage,
        startRecording,
        stopRecording,

        // Utils
        t
    };
}
