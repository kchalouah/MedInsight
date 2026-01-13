"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { auditApi } from "@/lib/api"
import {
    Search, Filter, Shield, Activity,
    Calendar, User, Server, Clock, Download
} from "lucide-react"
import { motion } from "framer-motion"

interface AuditLog {
    id: string;
    userId: string;
    action: string;
    serviceName: string;
    description: string;
    timestamp: string;
    ipAddress?: string;
    status: string;
}

export default function AdminAuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [serviceFilter, setServiceFilter] = useState("ALL")

    useEffect(() => {
        fetchLogs()
    }, [])

    async function fetchLogs() {
        setLoading(true)
        try {
            const data = await auditApi.getLogs()
            setLogs(data)
        } catch (err) {
            console.error("Failed to fetch logs", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesService = serviceFilter === "ALL" || log.serviceName === serviceFilter

        return matchesSearch && matchesService
    })

    const getStatusBadge = (status: string) => {
        if (status === "SUCCESS") return "bg-green-100 text-green-700"
        if (status === "FAILURE") return "bg-red-100 text-red-700"
        return "bg-blue-100 text-blue-700"
    }

    const services = ["ALL", ...new Set(logs.map(l => l.serviceName))]

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="w-7 h-7 text-primary" />
                            Journaux d'Audit Système
                        </h1>
                        <p className="text-slate-500">Surveillance en temps réel des actions critiques</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors shadow-sm text-slate-600 font-medium"
                    >
                        <Clock className="w-5 h-5" />
                        Rafraîchir
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher par action, description ou ID utilisateur..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Server className="text-slate-400 w-5 h-5" />
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                        >
                            {services.map(s => (
                                <option key={s} value={s}>{s === "ALL" ? "Tous les services" : s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Horodatage</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Action</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Service</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Utilisateur</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Détails</th>
                                    <th className="text-center py-4 px-6 font-semibold text-slate-600">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                                            Chargement des journaux...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                                            Aucun journal trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log, index) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-slate-50 transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                    <Clock className="w-3.5 h-3.5 ml-1" />
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-semibold text-slate-700 text-sm uppercase">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Server className="w-3.5 h-3.5" />
                                                    {log.serviceName}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[120px]" title={log.userId}>
                                                        {log.userId}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600 italic">
                                                {log.description}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
