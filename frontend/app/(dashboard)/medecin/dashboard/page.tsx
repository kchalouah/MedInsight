"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import { Users, Calendar, FileText, TrendingUp, Clock, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { appointmentApi, AppointmentResponse } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function MedecinDashboard() {
    const { user } = useAuth()
    const router = useRouter()

    // State
    const [todayStats, setTodayStats] = useState({
        patients: 0,
        completed: 0,
        pending: 0
    })
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([])

    useEffect(() => {
        if (user) {
            fetchDashboardData()
        }
    }, [user])

    async function fetchDashboardData() {
        if (!user) return
        try {
            // Fetch appointments for today 
            // note: backend filtering by exact date might need ISO strings or specific params
            // For now, fetching recent 20 and filtering client side for 'today' if needed, 
            // or just showing all upcoming. let's assume we want upcoming
            const data = await appointmentApi.getAppointments({
                doctorId: user.keycloakId,
                size: 20
            })

            const today = new Date().toDateString()
            const todaysApps = data.content.filter(a => new Date(a.appointmentDateTime).toDateString() === today)
            const completed = todaysApps.filter(a => a.status === 'COMPLETED').length
            const pending = todaysApps.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length

            setTodayStats({
                patients: todaysApps.length,
                completed: completed,
                pending: pending
            })
            setAppointments(todaysApps) // Showing today's appointments in the list
        } catch (err) {
            console.error("Failed to fetch doctor dashboard", err)
        }
    }

    if (!user) return null

    return (
        <DashboardLayout role="medecin">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Bonjour, Dr. {user.lastName} 👨‍⚕️
                </h1>
                <p className="text-slate-600">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Patients aujourd'hui"
                    value={todayStats.patients}
                    icon={Users}
                    variant="primary"
                />
                <StatsCard
                    title="Terminées"
                    value={todayStats.completed}
                    icon={Activity}
                    variant="success"
                />
                <StatsCard
                    title="En attente"
                    value={todayStats.pending}
                    icon={Clock}
                    variant="warning"
                />
                <StatsCard
                    title="Taux de complétion"
                    value={`${todayStats.patients > 0 ? Math.round((todayStats.completed / todayStats.patients) * 100) : 0}%`}
                    icon={TrendingUp}
                    variant="default"
                />
            </div>

            {/* Today's Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-card"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Planning d'aujourd'hui
                        </h3>
                        {appointments.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 italic">
                                Aucun rendez-vous prévu pour aujourd'hui.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {appointments.map((apt, index) => (
                                    <div
                                        key={apt.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${apt.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
                                            'bg-slate-50 border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <Clock className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {new Date(apt.appointmentDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{apt.patientName || "Patient"}</p>
                                                <p className="text-sm text-slate-600">{apt.reason}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                'bg-orange-100 text-orange-700'
                                                }`}>
                                                {apt.status === 'COMPLETED' ? 'Terminé' : 'Prévu'}
                                            </span>
                                            {apt.status !== 'COMPLETED' && (
                                                <button
                                                    onClick={() => router.push(`/medecin/consultation/${apt.id}`)}
                                                    className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1"
                                                >
                                                    <Activity className="w-3.5 h-3.5" />
                                                    Démarrer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Quick Access Panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="bg-gradient-to-br from-primary/5 to-teal-500/5 backdrop-blur-md border border-primary/20 rounded-2xl p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Accès Rapide</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/medecin/appointments')}
                                className="w-full p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-left"
                            >
                                📅 Voir tout le planning
                            </button>
                            <button
                                onClick={() => router.push('/medecin/patients')}
                                className="w-full p-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-left flex items-center gap-2"
                            >
                                <Users className="w-4 h-4 text-slate-400" />
                                Rechercher un patient
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    )
}
