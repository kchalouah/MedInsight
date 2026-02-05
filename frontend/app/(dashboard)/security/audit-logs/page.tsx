"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const mockLogs = [
    { id: "1", timestamp: "2026-01-11 15:25:30", user: "ahmed@example.com", action: "LOGIN_SUCCESS", service: "auth-service", result: "SUCCESS", ip: "197.0.0.1" },
    { id: "2", timestamp: "2026-01-11 15:20:15", user: "f.gharbi@medinsight.tn", action: "APPOINTMENT_CREATED", service: "appointment-service", result: "SUCCESS", ip: "197.0.0.2" },
    { id: "3", timestamp: "2026-01-11 15:15:42", user: "sara@example.com", action: "PROFILE_UPDATE", service: "auth-service", result: "SUCCESS", ip: "197.0.0.3" },
    { id: "4", timestamp: "2026-01-11 15:10:03", user: "unknown@test.com", action: "LOGIN_FAILED", service: "auth-service", result: "FAILED", ip: "45.12.34.56" },
    { id: "5", timestamp: "2026-01-11 15:05:21", user: "k.mansour@medinsight.tn", action: "PRESCRIPTION_CREATED", service: "appointment-service", result: "SUCCESS", ip: "197.0.0.4" },
    { id: "6", timestamp: "2026-01-11 15:00:18", user: "admin@medinsight.tn", action: "USER_CREATED", service: "auth-service", result: "SUCCESS", ip: "197.0.0.5" },
    { id: "7", timestamp: "2026-01-11 14:55:10", user: "security@medinsight.tn", action: "AUDIT_LOG_VIEW", service: "audit-service", result: "SUCCESS", ip: "197.0.0.6" },
    { id: "8", timestamp: "2026-01-11 14:50:33", user: "ahmed@example.com", action: "MEDICAL_RECORD_VIEW", service: "medical-record-service", result: "SUCCESS", ip: "197.0.0.1" },
]

const serviceColors: Record<string, string> = {
    "auth-service": "bg-blue-100 text-blue-700 border-blue-200",
    "appointment-service": "bg-primary/20 text-primary border-primary/30",
    "medical-record-service": "bg-purple-100 text-purple-700 border-purple-200",
    "audit-service": "bg-orange-100 text-orange-700 border-orange-200",
}

export default function SecurityAuditLogsPage() {
    const [logs, setLogs] = useState(mockLogs)
    const [searchQuery, setSearchQuery] = useState("")
    const [serviceFilter, setServiceFilter] = useState("ALL")
    const [resultFilter, setResultFilter] = useState("ALL")

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.ip.includes(searchQuery)
        const matchesService = serviceFilter === "ALL" || log.service === serviceFilter
        const matchesResult = resultFilter === "ALL" || log.result === resultFilter
        return matchesSearch && matchesService && matchesResult
    })

    return (
        <DashboardLayout role="security">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Logs d'Audit</h1>
                        <p className="text-slate-600 mt-1">Consultation détaillée des événements système</p>
                    </div>
                    <Button className="gap-2">
                        <Download className="w-4 h-4" />
                        Exporter les logs
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Rechercher par utilisateur, action ou IP..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 border-slate-300 focus:border-primary"
                        />
                    </div>
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="px-4 h-11 border border-slate-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                        <option value="ALL">Tous les services</option>
                        <option value="auth-service">Auth Service</option>
                        <option value="appointment-service">Appointment Service</option>
                        <option value="medical-record-service">Medical Record Service</option>
                        <option value="audit-service">Audit Service</option>
                    </select>
                    <select
                        value={resultFilter}
                        onChange={(e) => setResultFilter(e.target.value)}
                        className="px-4 h-11 border border-slate-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                        <option value="ALL">Tous les résultats</option>
                        <option value="SUCCESS">Succès</option>
                        <option value="FAILED">Échecs</option>
                    </select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4">
                        <p className="text-sm text-slate-600">Total Logs</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{logs.length}</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-md border border-green-200 rounded-2xl p-4">
                        <p className="text-sm text-green-700">Succès</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                            {logs.filter(l => l.result === "SUCCESS").length}
                        </p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-md border border-red-200 rounded-2xl p-4">
                        <p className="text-sm text-red-700">Échecs</p>
                        <p className="text-2xl font-bold text-red-900 mt-1">
                            {logs.filter(l => l.result === "FAILED").length}
                        </p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4">
                        <p className="text-sm text-slate-600">Services Actifs</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                            {new Set(logs.map(l => l.service)).size}
                        </p>
                    </div>
                </div>

                {/* Logs Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-card overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Timestamp</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Utilisateur</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Action</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Service</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">IP</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Résultat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.map((log, index) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="py-4 px-6 text-sm text-slate-600 font-mono">{log.timestamp}</td>
                                        <td className="py-4 px-6 text-sm text-slate-900 font-medium">{log.user}</td>
                                        <td className="py-4 px-6 text-sm text-slate-600 font-mono">{log.action}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${serviceColors[log.service] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                {log.service}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600 font-mono">{log.ip}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.result === "SUCCESS"
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.result}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredLogs.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Aucun log trouvé</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    )
}
