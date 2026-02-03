"use client"

import { ExternalLink, Database, Activity, Search, Shield, Cpu } from "lucide-react"
import { motion } from "framer-motion"

const INFRA_LINKS = [
    { name: "Grafana", desc: "Dashboards & Metrics", url: "http://localhost:3000", icon: Activity, color: "text-orange-500", bg: "bg-orange-50" },
    { name: "Prometheus", desc: "System Monitoring", url: "http://localhost:9090", icon: Cpu, color: "text-red-500", bg: "bg-red-50" },
    { name: "pgAdmin", desc: "Database Manager", url: "http://localhost:5050", icon: Database, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Eureka", desc: "Service Discovery", url: "/eureka", icon: Search, color: "text-green-500", bg: "bg-green-50" },
    { name: "Keycloak", desc: "Identity & Access", url: "/auth", icon: Shield, color: "text-purple-500", bg: "bg-purple-50" }
]

export default function QuickLinks() {
    return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Infrastructure & Outils
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {INFRA_LINKS.map((link, idx) => (
                    <motion.a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -4 }}
                        className="flex flex-col p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all bg-slate-50/50"
                    >
                        <div className={`w-10 h-10 rounded-lg ${link.bg} flex items-center justify-center mb-3`}>
                            <link.icon className={`w-6 h-6 ${link.color}`} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{link.name}</span>
                        <span className="text-xs text-slate-500 mt-1">{link.desc}</span>
                    </motion.a>
                ))}
            </div>
        </div>
    )
}
