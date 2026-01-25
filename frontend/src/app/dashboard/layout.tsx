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
                <main className="flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
