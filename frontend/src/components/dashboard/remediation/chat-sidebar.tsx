"use client";

import { useRef, useEffect, useState, FormEvent } from "react";
import { Send, Bot, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatSidebarProps {
    loanId?: number;
    healthScore?: string;
}

export function ChatSidebar({ loanId = 1, healthScore }: ChatSidebarProps) {
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: healthScore
                ? `Hi! I've analyzed your documents and calculated a **Health Score of ${healthScore}/100**. Ask me anything about your score, red flags, or how to improve your loan readiness.`
                : "Hi! I'm your FinCo-Pilot. Upload your documents and I'll help you understand your loan readiness and how to improve it."
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: inputValue.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    loanId: loanId
                })
            });

            if (!response.ok) throw new Error("Chat failed");

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: ""
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    assistantContent += chunk;

                    // Update the last message with new content
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: assistantContent
                        };
                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
    };

    const SUGGESTIONS = [
        "Why is my score what it is?",
        "What are my biggest red flags?",
        "How can I improve my DTI ratio?",
        "Draft an explanation letter",
    ];

    return (
        <Card className="flex flex-col h-[calc(100vh-12rem)] md:h-[600px] border-border/50 shadow-md overflow-hidden bg-slate-50 dark:bg-slate-900/50">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-white dark:bg-slate-950">
                <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-5 w-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-950" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1">
                        FinCo-Pilot
                        <Sparkles className="h-3 w-3 text-amber-500" />
                    </h3>
                    <p className="text-xs text-green-600 font-medium">
                        {isLoading ? "Thinking..." : "Online"}
                    </p>
                </div>

                <div className="ml-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                            try {
                                setMessages([{
                                    id: "welcome",
                                    role: "assistant",
                                    content: healthScore
                                        ? `Hi! I've analyzed your documents and calculated a **Health Score of ${healthScore}/100**. Ask me anything about your score, red flags, or how to improve your loan readiness.`
                                        : "Hi! I'm your FinCo-Pilot. Upload your documents and I'll help you understand your loan readiness and how to improve it."
                                }]);
                                // Optional: Call backend to clear server-side history if exists
                                // await fetch(`/api/chat/clear/${loanId}`, { method: 'POST' });
                            } catch (e) {
                                console.error("Failed to clear chat", e);
                            }
                        }}
                        title="Clear Chat"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 mt-1 border border-border shrink-0">
                            {msg.role === 'assistant' ? (
                                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                                    <Bot className="h-4 w-4" />
                                </div>
                            ) : (
                                <AvatarFallback>RS</AvatarFallback>
                            )}
                        </Avatar>
                        <div className={`rounded-2xl p-3 text-sm max-w-[85%] ${msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-white dark:bg-slate-800 border border-border/50 shadow-sm rounded-tl-sm'
                            }`}>
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 max-w-none">
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1 border border-border flex-shrink-0">
                            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                                <Bot className="h-4 w-4" />
                            </div>
                        </Avatar>
                        <div className="rounded-2xl rounded-tl-sm p-3 bg-white dark:bg-slate-800 border border-border/50 shadow-sm">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Analyzing your documents...
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={onSubmit} className="p-4 bg-white dark:bg-slate-950 border-t border-border/50 space-y-3">
                {/* Quick Action Pills */}
                <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion, i) => (
                        <button
                            key={i}
                            type="button"
                            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-left truncate max-w-full border border-transparent hover:border-primary/20"
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ask about your loan readiness..."
                        className="w-full h-10 px-4 pr-12 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 rounded-full"
                        disabled={!inputValue.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
