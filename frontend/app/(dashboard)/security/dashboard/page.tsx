"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import QuickLinks from "@/components/ui/QuickLinks"
import { Shield, Search, AlertTriangle, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"

const mockStats = {
    totalLogs: 1247,
    failedLogins: 3,
    suspiciousActivities: 0,
    activeAlerts: 0
}

const mockRecentLogs = [
    { timestamp: "2026-01-11 14:25:30", user: "ahmed@example.com", action: "LOGIN_SUCCESS", service: "auth-service", result: "SUCCESS" },
    { timestamp: "2026-01-11 14:20:15", user: "f.gharbi@medinsight.tn", action: "CONSULTATION_CREATED", service: "appointment-service", result: "SUCCESS" },
    { timestamp: "2026-01-11 14:15:42", user: "sara@example.com", action: "PROFILE_UPDATE", service: "auth-service", result: "SUCCESS" },
    { timestamp: "2026-01-11 14:10:03", user: "unknown@test.com", action: "LOGIN_FAILED", service: "auth-service", result: "FAILED" },
    { timestamp: "2026-01-11 14:05:21", user: "k.mansour@medinsight.tn", action: "PRESCRIPTION_CREATED", service: "appointment-service", result: "SUCCESS" },
]

export default function SecurityDashboard() {
    const { user } = useAuth()

    if (!user) return null

    return (
        <DashboardLayout role="security">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Centre de Sécurité 🛡️
                </h1>
                <p className="text-slate-600">
                    Monitoring et supervision des logs d'audit
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Logs aujourd'hui"
                    value={mockStats.totalLogs}
                    icon={Activity}
                    variant="primary"
                />
                <StatsCard
                    title="Tentatives échouées"
                    value={mockStats.failedLogins}
                    icon={AlertTriangle}
                    variant="warning"
                />
                <StatsCard
                    title="Activités suspectes"
                    value={mockStats.suspiciousActivities}
                    icon={Shield}
                    variant="success"
                />
                <StatsCard
                    title="Alertes actives"
                    value={mockStats.activeAlerts}
                    icon={AlertTriangle}
                    variant="success"
                />
            </div>

            {/* Infrastructure Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <QuickLinks />
            </motion.div>

            {/* Recent Audit Logs */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Logs d'Audit Récents</h3>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
                                Filtrer
                            </button>
                            <button className="px-3 py-1.5 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors">
                                <Search className="w-4 h-4 inline mr-1" />
                                Recherche avancée
                            </button>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Timestamp</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Utilisateur</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Service</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Résultat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockRecentLogs.map((log, index) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4 text-sm text-slate-600">{log.timestamp}</td>
                                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{log.user}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{log.action}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                                {log.service}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${log.result === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Quick Security Actions */}
            <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Actions Rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-6 text-left bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl hover:shadow-card-hover transition-all">
                        <Search className="w-8 h-8 text-primary mb-3" />
                        <h4 className="font-semibold text-slate-900 mb-1">Recherche avancée</h4>
                        <p className="text-sm text-slate-600">Filtrer logs par critères</p>
                    </button>
                    <button className="p-6 text-left bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl hover:shadow-card-hover transition-all">
                        <Activity className="w-8 h-8 text-green-600 mb-3" />
                        <h4 className="font-semibold text-slate-900 mb-1">Rapport de sécurité</h4>
                        <p className="text-sm text-slate-600">Générer rapport PDF</p>
                    </button>
                    <button className="p-6 text-left bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl hover:shadow-card-hover transition-all">
                        <AlertTriangle className="w-8 h-8 text-orange-600 mb-3" />
                        <h4 className="font-semibold text-slate-900 mb-1">Alertes actives</h4>
                        <p className="text-sm text-slate-600">0 alertes en cours</p>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    )
}
