"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, HelpCircle, LogOut } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Header() {
    const pathname = usePathname();
    const { language, setLanguage, t } = useLanguage();

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
                            <BreadcrumbLink href="/" className="transition-colors hover:text-foreground">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {isDashboardRoot ? (
                                <BreadcrumbPage>Overview</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</BreadcrumbLink>
                            )}
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
                    {/* Language Selector */}
                    <Select value={language} onValueChange={(val) => setLanguage(val as LanguageCode)}>
                        <SelectTrigger className="w-[110px] h-8 text-[13px] bg-white border-[#E5E5E5] dark:bg-[#30302E] dark:border-[#404040]">
                            <SelectValue placeholder={t('language')} />
                        </SelectTrigger>
                        <SelectContent align="end" className="w-[150px]">
                            {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} className="text-[13px]">
                                    <span className="mr-2">{lang.flag}</span>
                                    {lang.label}
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
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-medium text-[#1F1E1D] dark:text-[#ECECEC]">Rahul S.</p>
                            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{t('msme_owner')}</p>
                        </div>
                        <Avatar className="h-8 w-8 border border-[#E5E5E5] dark:border-[#404040]">
                            <AvatarImage src="/avatars/01.png" alt="Rahul S." />
                            <AvatarFallback className="bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white text-xs">RS</AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B7280] hover:text-red-500 dark:hover:text-red-400">
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">{t('log_out')}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
