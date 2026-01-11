"use client"

import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface QuickActionCardProps {
    title: string
    description: string
    icon: LucideIcon
    onClick: () => void
    variant?: "default" | "primary" | "success"
}

const variantStyles = {
    default: {
        bg: "bg-white",
        iconBg: "bg-slate-100",
        iconColor: "text-slate-600",
        hoverBg: "hover:bg-slate-50"
    },
    primary: {
        bg: "bg-gradient-to-br from-primary/5 to-teal-500/5",
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        hoverBg: "hover:bg-primary/10"
    },
    success: {
        bg: "bg-gradient-to-br from-green-500/5 to-green-600/5",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        hoverBg: "hover:bg-green-50"
    }
}

export default function QuickActionCard({
    title,
    description,
    icon: Icon,
    onClick,
    variant = "default"
}: QuickActionCardProps) {
    const styles = variantStyles[variant]

    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`
                w-full text-left p-6 rounded-xl border border-slate-200 
                shadow-card hover:shadow-card-hover transition-all
                ${styles.bg} ${styles.hoverBg}
            `}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${styles.iconBg}`}>
                    <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
                    <p className="text-sm text-slate-600">{description}</p>
                </div>
            </div>
        </motion.button>
    )
}
