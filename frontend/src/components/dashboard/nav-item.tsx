"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
    href: string;
    icon: LucideIcon;
    label: string;
}

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                    ? "bg-[#D46B4F]/10 text-[#D46B4F] hover:bg-[#D46B4F]/15"
                    : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F0EEE6] dark:hover:bg-[#30302E] hover:text-[#1F1E1D] dark:hover:text-[#ECECEC]"
            )}
        >
            <Icon className={cn("h-4 w-4", isActive ? "text-[#D46B4F]" : "text-current")} />
            {label}
        </Link>
    );
}
