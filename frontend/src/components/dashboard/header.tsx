"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MobileSidebar } from "./sidebar";

export function Header() {
    const pathname = usePathname();

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
                    <Button variant="ghost" size="sm" className="hidden text-muted-foreground hover:text-primary sm:inline-flex">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Need Help?
                    </Button>
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                        <span className="sr-only">Notifications</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
