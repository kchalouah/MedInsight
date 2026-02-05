"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { auditApi, AuditLog } from "@/lib/api"
import {
    Search, Filter, Shield, Activity,
    Calendar, User, Server, Clock, Download, Tag
} from "lucide-react"
import { motion } from "framer-motion"

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
            (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher par action, email ou ID utilisateur..."
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm italic">Horodatage</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm uppercase">Action</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm uppercase">Service</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm uppercase">Utilisateur</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm uppercase">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                                            Chargement des journaux...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">
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
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className="text-xs text-slate-500 font-medium">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-700 text-xs">
                                                    {log.action}
                                                </div>
                                                <div className="text-[10px] text-slate-500 max-w-xs truncate" title={log.details}>
                                                    {log.details || "Sans détails"}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                    <Server className="w-3.5 h-3.5 text-primary/60" />
                                                    {log.serviceName}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        {log.userEmail || log.userId}
                                                    </div>
                                                    {log.userRole && (
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase mt-0.5">
                                                            <Tag className="w-2.5 h-2.5" />
                                                            {log.userRole.replace("ROLE_", "")}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(log.status)}`}>
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
