"use client";

import { useRef, useEffect } from "react";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "@ai-sdk/react";

export function ChatSidebar() {
    const { messages, input, handleInputChange, handleSubmit, setInput } = useChat({
        api: "/api/chat",
        body: {
            loanId: 1,
        },
        initialMessages: [
            {
                id: "welcome",
                role: "assistant",
                content: "Hi Rahul. I've analyzed your plan. Ask me how to execute any of these steps."
            }
        ]
    } as any) as any;

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const SUGGESTIONS = [
        "Draft an explanation letter for bounces",
        "Calculate my new DTI if I close the small loan"
    ];

    return (
        <Card className="flex flex-col h-[calc(100vh-12rem)] md:h-[600px] border-border/50 shadow-md overflow-hidden bg-slate-50 dark:bg-slate-900/50">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-white dark:bg-slate-950">
                <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-5 w-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-950"></span>
                </div>
                <div>
                    <h3 className="font-semibold text-sm">FinCo-Pilot</h3>
                    <p className="text-xs text-green-600 font-medium">Online</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg: any) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 mt-1 border border-border">
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
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-slate-950 border-t border-border/50 space-y-3">
                {/* Pills */}
                <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion, i) => (
                        <button
                            key={i}
                            type="button"
                            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors text-left truncate max-w-full"
                            onClick={() => setInput(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Input
                        placeholder="Ask follow-up questions..."
                        className="pr-12 rounded-full border-slate-200 dark:border-slate-800 focus-visible:ring-primary"
                        value={input ?? ""}
                        onChange={handleInputChange}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 rounded-full"
                        disabled={!input?.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Card>
    );
}
