"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import QuickActionCard from "@/components/ui/QuickActionCard"
import { Calendar, FileText, Pill, Activity, Clock, User } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

// TODO: Replace with API calls
const mockStats = {
    upcomingAppointments: 2,
    totalPrescriptions: 5,
    lastVisit: "15/12/2025"
}

const mockNextAppointment = {
    date: "18/01/2026",
    time: "10:30",
    doctorName: "Dr. Fatma Gharbi",
    specialty: "Cardiologie"
}

const mockRecentActivity = [
    { date: "15/12/2025", type: "Consultation", doctor: "Dr. Fatma Gharbi" },
    { date: "10/12/2025", type: "Ordonnance", doctor: "Dr. Fatma Gharbi" },
    { date: "05/12/2025", type: "Analyse de sang", doctor: "Laboratoire Central" },
]

export default function PatientDashboard() {
    const { user } = useAuth()

    if (!user) return null

    return (
        <DashboardLayout role="patient">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Bonjour, {user.firstName || user.name.split(' ')[0]} 👋
                </h1>
                <p className="text-slate-600">
                    Bienvenue sur votre espace patient MedInsight
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Rendez-vous à venir"
                    value={mockStats.upcomingAppointments}
                    icon={Calendar}
                    variant="primary"
                />
                <StatsCard
                    title="Ordonnances actives"
                    value={mockStats.totalPrescriptions}
                    icon={Pill}
                    variant="success"
                />
                <StatsCard
                    title="Dernière visite"
                    value={mockStats.lastVisit}
                    icon={Clock}
                    variant="default"
                />
            </div>

            {/* Next Appointment Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gradient-to-br from-primary/5 to-teal-500/5 backdrop-blur-md border border-primary/20 rounded-xl p-6 shadow-card"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                    Prochain Rendez-vous
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {mockNextAppointment.date} à {mockNextAppointment.time}
                                </p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Calendar className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-slate-500" />
                                <span className="text-slate-700 font-medium">{mockNextAppointment.doctorName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-slate-500" />
                                <span className="text-slate-700">{mockNextAppointment.specialty}</span>
                            </div>
                        </div>
                        <Link
                            href="/patient/appointments"
                            className="mt-4 inline-block px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                        >
                            Voir les détails
                        </Link>
                    </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card"
                >
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Activité Récente</h3>
                    <div className="space-y-4">
                        {mockRecentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">{activity.type}</p>
                                    <p className="text-xs text-slate-500">{activity.doctor}</p>
                                    <p className="text-xs text-slate-400 mt-1">{activity.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Actions Rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <QuickActionCard
                        title="Prendre un rendez-vous"
                        description="Réserver une consultation avec un médecin"
                        icon={Calendar}
                        onClick={() => window.location.href = '/patient/appointments'}
                        variant="primary"
                    />
                    <QuickActionCard
                        title="Mon Dossier Médical"
                        description="Consulter mon historique médical"
                        icon={FileText}
                        onClick={() => window.location.href = '/patient/dossier'}
                        variant="default"
                    />
                    <QuickActionCard
                        title="Mes Ordonnances"
                        description="Voir mes prescriptions récentes"
                        icon={Pill}
                        onClick={() => window.location.href = '/patient/prescriptions'}
                        variant="success"
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}
