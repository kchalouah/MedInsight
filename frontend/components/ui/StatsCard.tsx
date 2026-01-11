"use client"

import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    variant?: "default" | "primary" | "success" | "warning"
}

const variantStyles = {
    default: "from-slate-500/10 to-slate-600/10 text-slate-600",
    primary: "from-primary/10 to-teal-600/10 text-primary",
    success: "from-green-500/10 to-green-600/10 text-green-600",
    warning: "from-orange-500/10 to-orange-600/10 text-orange-600",
}

export default function StatsCard({ title, value, icon: Icon, trend, variant = "default" }: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 20px 50px -10px rgba(13, 148, 136, 0.3)" }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
                    {trend && (
                        <p className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% ce mois
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${variantStyles[variant]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    )
}
