"use client"

import { motion } from "framer-motion"
import { CurrencyInr, ChartPieSlice, TrendUp, Wallet, Bank } from "@phosphor-icons/react"

export function FinanceAnimation() {
    return (
        <div className="relative w-full h-full flex items-center justify-center -translate-y-8">
            {/* Central Rupee Icon - Removed opacity animation to ensure visibility */}
            <div
                className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#D46B4F] text-white shadow-xl shadow-[#D46B4F]/30"
            >
                <CurrencyInr className="h-12 w-12" weight="bold" />
            </div>

            {/* Pulse Effect Behind */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute z-0 h-24 w-24 rounded-2xl bg-[#D46B4F]/20"
            />

            {/* Orbiting Icons Ring */}
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute h-64 w-64 rounded-full border border-dashed border-[#D46B4F]/30"
            >
                {/* Floating Icons on the Ring */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAFAF8] p-2 rounded-full shadow-sm text-[#D46B4F]">
                    <ChartPieSlice className="h-6 w-6" />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-[#FAFAF8] p-2 rounded-full shadow-sm text-[#D46B4F]">
                    <Wallet className="h-6 w-6" />
                </div>
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAFAF8] p-2 rounded-full shadow-sm text-[#D46B4F]">
                    <TrendUp className="h-6 w-6" />
                </div>
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-[#FAFAF8] p-2 rounded-full shadow-sm text-[#D46B4F]">
                    <Bank className="h-6 w-6" />
                </div>
            </motion.div>

            {/* Outer Glow Ring */}
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: -360 }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute h-80 w-80 rounded-full border border-[#E6DCD5] opacity-60"
            >
                <div className="absolute top-10 left-10 h-3 w-3 rounded-full bg-[#D46B4F]/40" />
                <div className="absolute bottom-10 right-10 h-3 w-3 rounded-full bg-[#D46B4F]/40" />
            </motion.div>

            {/* Decoratve Blurred Background Orbs */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#D46B4F]/5 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#D46B4F]/5 blur-3xl" />
        </div>
    )
}
