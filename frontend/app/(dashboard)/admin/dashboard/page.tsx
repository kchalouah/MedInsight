"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import { Users, Calendar, TrendingUp, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { adminApi, appointmentApi } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
    const { user } = useAuth()
    const router = useRouter()

    // Stats State
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeAppointments: 0,
        newRegistrations: 0,
        systemHealth: "100%"
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            // Fetch User Count
            const userData = await adminApi.getUsers(0, 1)

            // Fetch Appointment Count
            const appointmentData = await appointmentApi.getAppointments({ size: 1 })

            setStats({
                totalUsers: userData.totalElements,
                activeAppointments: appointmentData.totalElements,
                newRegistrations: Math.floor(userData.totalElements * 0.1), // Estimated/Simulated
                systemHealth: "100%" // Placeholder for now
            })
        } catch (err) {
            console.error("Failed to fetch admin dashboard data", err)
        }
    }

    if (!user) return null

    return (
        <DashboardLayout role="admin">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Tableau de bord Administrateur ⚙️
                </h1>
                <p className="text-slate-600">
                    Gestion et supervision de la plateforme MedInsight
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total utilisateurs"
                    value={stats.totalUsers}
                    icon={Users}
                    variant="primary"
                    trend={{ value: 8, isPositive: true }}
                />
                <StatsCard
                    title="Rendez-vous (Total)"
                    value={stats.activeAppointments}
                    icon={Calendar}
                    variant="success"
                />
                <StatsCard
                    title="Nouvelles inscriptions"
                    value={`+${stats.newRegistrations}`}
                    icon={TrendingUp}
                    variant="warning"
                    trend={{ value: 15, isPositive: true }}
                />
                <StatsCard
                    title="Santé du système"
                    value={stats.systemHealth}
                    icon={Activity}
                    variant="success"
                />
            </div>

            {/* Recent User Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card"
                >
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Gestion Rapide</h3>
                    <p className="text-slate-500 mb-4">
                        Accédez rapidement à la gestion des utilisateurs pour valider les nouveaux comptes ou modifier les permissions.
                    </p>
                    <button
                        onClick={() => router.push('/admin/users')}
                        className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        Voir tous les utilisateurs →
                    </button>
                </motion.div>

                {/* Quick Admin Actions */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="bg-gradient-to-br from-primary/5 to-teal-500/5 backdrop-blur-md border border-primary/20 rounded-xl p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions Rapides</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="w-full p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-left"
                            >
                                👤 Créer un utilisateur
                            </button>
                            <button
                                onClick={() => router.push('/admin/reports')}
                                className="w-full p-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-left"
                            >
                                📊 Voir les rapports
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div >
        </DashboardLayout >
    )
}
