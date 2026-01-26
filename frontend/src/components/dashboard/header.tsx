"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, LayoutDashboard, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MobileSidebar } from "./sidebar";
import { useLanguage, LANGUAGES, LanguageCode } from "@/contexts/language-context";
import { useSession, signIn, signOut } from "next-auth/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();
    const { data: session } = useSession();

    // Simple breadcrumb generation logic
    const segments = pathname.split("/").filter(Boolean);
    // Example: ['dashboard', 'documents'] -> Home > Dashboard > Documents? 
    // Or just Home > Overview (if dashboard is root).

    const isDashboardRoot = segments.length === 1 && segments[0] === "dashboard";

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-border/40 bg-background/80 px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4 md:hidden">
                <MobileSidebar />
            </div>

            <div className="flex flex-1 items-center justify-between">
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Select
                                value={pathname.startsWith("/marketplace") ? "marketplace" : "dashboard"}
                                onValueChange={(val) => router.push(val === "marketplace" ? "/marketplace" : "/dashboard")}
                            >
                                <SelectTrigger className="w-[140px] h-9 gap-2 px-3 text-sm font-medium bg-transparent border-none hover:bg-muted/50 transition-colors focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="start" className="min-w-[140px]">
                                    <SelectItem value="dashboard" className="cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="marketplace" className="cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <Store className="w-4 h-4" />
                                            <span>Marketplace</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </BreadcrumbItem>
                        {!isDashboardRoot && segments.slice(1).map((segment, index) => {
                            const isLast = index === segments.slice(1).length - 1;
                            const href = `/dashboard/${segments.slice(1, index + 2).join('/')}`;
                            const title = segment.charAt(0).toUpperCase() + segment.slice(1);

                            return (
                                <div key={href} className="flex items-center">
                                    <BreadcrumbSeparator className="mx-2" />
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{title}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={href} className="transition-colors hover:text-foreground">{title}</BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </div>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Placeholder for Mobile Breadcrumb or Title if needed */}
                {/* Placeholder for Mobile Breadcrumb or Title if needed */}
                <div className="md:hidden font-semibold text-slate-900 ml-2">
                    CreditSetu AI
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Selector - Compact Design */}
                    <Select value={language} onValueChange={(val) => setLanguage(val as LanguageCode)}>
                        <SelectTrigger className="w-auto min-w-[70px] h-9 gap-1.5 px-3 text-sm font-medium bg-white dark:bg-[#2B2A29] border-[#E5E5E5] dark:border-[#404040] rounded-lg hover:bg-slate-50 dark:hover:bg-[#363635] transition-colors">
                            <span className="text-base leading-none">{LANGUAGES.find(l => l.code === language)?.flag}</span>
                            <span className="text-[13px] text-slate-700 dark:text-slate-300 uppercase tracking-wide">{language}</span>
                        </SelectTrigger>
                        <SelectContent align="end" className="min-w-[160px] rounded-lg">
                            {LANGUAGES.map((lang) => (
                                <SelectItem
                                    key={lang.code}
                                    value={lang.code}
                                    className="text-sm cursor-pointer rounded-md"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary mr-2">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                        <span className="sr-only">Notifications</span>
                    </Button>

                    <div className="h-8 w-px bg-[#E5E5E5] dark:bg-[#404040] mx-2" />

                    {/* User Badge */}
                    <div className="flex items-center gap-3">
                        {session?.user ? (
                            <>
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium text-[#1F1E1D] dark:text-[#ECECEC]">{session.user.name}</p>
                                    <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{session.user.email}</p>
                                </div>
                                <Avatar className="h-8 w-8 border border-[#E5E5E5] dark:border-[#404040]">
                                    <AvatarImage src={session.user.image || "/avatars/01.png"} alt={session.user.name || "User"} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white text-xs">
                                        {session.user.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#6B7280] hover:text-red-500 dark:hover:text-red-400"
                                    onClick={() => signOut()}
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="sr-only">{t('log_out')}</span>
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => signIn("google")}
                                className="h-9 rounded-full bg-[#2A3B52] text-white hover:bg-[#2A3B52]/90 px-4 text-sm font-medium shadow-sm"
                            >
                                Log in
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
