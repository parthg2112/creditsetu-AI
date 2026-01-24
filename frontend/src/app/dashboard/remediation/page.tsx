"use client";

import { ActionPlan } from "@/components/dashboard/remediation/action-plan";
import { ChatSidebar } from "@/components/dashboard/remediation/chat-sidebar";

export default function RemediationPage() {
    return (
        <div className="grid gap-8 lg:grid-cols-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Panel: Action Plan (70% -> 7 cols) */}
            <div className="lg:col-span-7">
                <ActionPlan />
            </div>

            {/* Right Panel: AI Chat Sidebar (30% -> 3 cols) */}
            <div className="lg:col-span-3">
                <div className="sticky top-24">
                    <ChatSidebar />
                </div>
            </div>
        </div>
    );
}
