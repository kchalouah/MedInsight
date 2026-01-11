"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp, Users, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { adminApi, appointmentApi } from "@/lib/api"

export default function AdminReportsPage() {
    const [dateRange, setDateRange] = useState("7days")
    const [stats, setStats] = useState({
        totalAppointments: 0,
        newPatients: 0,
        totalUsers: 0,
        activeDoctors: 0,
        systemUptime: "99.9%"
    })

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            // 1. Total Appointments
            const appointmentData = await appointmentApi.getAppointments({ size: 1 })

            // 2. Users Count
            const userData = await adminApi.getUsers(0, 1)

            setStats(prev => ({
                ...prev,
                totalAppointments: appointmentData.totalElements,
                totalUsers: userData.totalElements,
                // Simulated metrics until backend supports deeper filtering locally
                newPatients: Math.floor(userData.totalElements * 0.2),
                activeDoctors: Math.floor(userData.totalElements * 0.1)
            }))
        } catch (err) {
            console.error("Failed to fetch stats", err)
        }
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Rapports d'Activité</h1>
                        <p className="text-slate-600 mt-1">Analyse et statistiques de la plateforme</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 h-11 border border-slate-300 rounded-lg focus:border-primary outline-none"
                        >
                            <option value="7days">7 derniers jours</option>
                            <option value="30days">30 derniers jours</option>
                            <option value="3months">3 derniers mois</option>
                            <option value="year">Cette année</option>
                        </select>
                        <Button className="gap-2">
                            <Download className="w-4 h-4" />
                            Exporter PDF
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-primary/5 to-teal-500/5 backdrop-blur-md border border-primary/20 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Total Rendez-vous</p>
                            <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.totalAppointments}</p>
                        <p className="text-xs text-green-600 font-medium mt-2">↑ 12% vs période précédente</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-500/5 to-green-600/5 backdrop-blur-md border border-green-200 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Total Utilisateurs</p>
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                        <p className="text-xs text-green-600 font-medium mt-2">↑ 8% vs période précédente</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 backdrop-blur-md border border-orange-200 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Médecins (Est.)</p>
                            <Activity className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.activeDoctors}</p>
                        <p className="text-xs text-slate-500 font-medium mt-2">→ Stable</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 backdrop-blur-md border border-blue-200 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Disponibilité</p>
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.systemUptime}</p>
                        <p className="text-xs text-green-600 font-medium mt-2">✓ Excellent</p>
                    </motion.div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Évolution des Rendez-vous</h3>
                        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                            <p className="text-slate-500">Intégration Graphique Recharts (Coming Soon)</p>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Spécialités les Plus Demandées</h3>
                        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                            <p className="text-slate-500">Intégration Graphique Recharts (Coming Soon)</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Activité Récente</h3>
                    <div className="space-y-3">
                        <div className="text-center text-slate-500 italic py-4">
                            Les journaux d'activité seront connectés via Audit Service.
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
