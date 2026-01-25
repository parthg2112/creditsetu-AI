import type { Metadata } from "next";

import { Header } from "@/components/dashboard/header";

export const metadata: Metadata = {
    title: "Dashboard - CreditSetu AI",
    description: "Manage your loan readiness and documents.",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
