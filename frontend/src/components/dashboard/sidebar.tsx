"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Folder, ClipboardCheck, TrendingUp, Settings, ShieldCheck, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavItem } from "./nav-item";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
    { label: "Chat", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Documents", href: "/dashboard/documents", icon: Folder },
    { label: "Audit Report", href: "/dashboard/audit", icon: ClipboardCheck },
    { label: "Remediation Plan", href: "/dashboard/remediation", icon: TrendingUp },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    return (
        <aside className="hidden md:flex h-screen w-64 flex-col border-r border-[#E5E5E5] dark:border-[#30302E] bg-[#FAFAF8] dark:bg-[#1F1E1D]">
            <div className="flex h-16 items-center border-b border-[#E5E5E5] dark:border-[#30302E] px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="font-serif text-lg font-bold tracking-tight text-[#1F1E1D] dark:text-[#ECECEC]">CreditSetu AI</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavItem key={item.href} {...item} />
                    ))}
                </nav>
            </div>

            <div className="border-t border-[#E5E5E5] dark:border-[#30302E] p-4">
                <div className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#2B2A29] p-3 shadow-sm">
                    <Avatar className="h-9 w-9 border border-[#E5E5E5] dark:border-[#404040]">
                        <AvatarImage src="/avatars/01.png" alt="Rahul S." />
                        <AvatarFallback className="bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white text-xs">RS</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-[#1F1E1D] dark:text-[#ECECEC]">Rahul S.</p>
                        <p className="truncate text-xs text-[#6B7280] dark:text-[#9CA3AF]">MSME Owner</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B7280] hover:text-red-500 dark:hover:text-red-400">
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Log out</span>
                    </Button>
                </div>
            </div>
        </aside>
    );
}

export function MobileSidebar() {
    const pathname = usePathname();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5 text-[#6B7280]" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-[#FAFAF8] dark:bg-[#1F1E1D] p-0">
                <SheetHeader className="border-b border-[#E5E5E5] dark:border-[#30302E] px-6 py-4">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <span className="font-serif text-lg font-bold tracking-tight text-[#1F1E1D] dark:text-[#ECECEC]">CreditSetu AI</span>
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100vh-65px)]">
                    <div className="flex-1 overflow-y-auto py-6 px-3">
                        <nav className="space-y-1">
                            {NAV_ITEMS.map((item) => (
                                <NavItem key={item.href} {...item} />
                            ))}
                        </nav>
                    </div>
                    <div className="border-t border-[#E5E5E5] dark:border-[#30302E] p-4">
                        <div className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#2B2A29] p-3 shadow-sm">
                            <Avatar className="h-9 w-9 border border-[#E5E5E5] dark:border-[#404040]">
                                <AvatarImage src="/avatars/01.png" alt="Rahul S." />
                                <AvatarFallback className="bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white text-xs">RS</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium text-[#1F1E1D] dark:text-[#ECECEC]">Rahul S.</p>
                                <p className="truncate text-xs text-[#6B7280] dark:text-[#9CA3AF]">MSME Owner</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" className="w-full justify-start text-[#6B7280] hover:text-red-500 border-[#E5E5E5] dark:border-[#404040] transition-colors">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
