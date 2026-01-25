"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import {
    Calendar, FileText, Pill, Activity,
    ChevronRight, Clock, MapPin, User
} from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { appointmentApi } from "@/lib/api"
import PatientAppointments from "@/components/PatientAppointments"
import Link from "next/link"

export default function PatientDashboard() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [prescriptionCount, setPrescriptionCount] = useState(0)

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData()
        }
    }, [user])

    async function fetchDashboardData() {
        setLoading(true)
        try {
            const [appsData, presData] = await Promise.all([
                appointmentApi.getAppointments({ patientId: user?.id }),
                appointmentApi.getPatientPrescriptions(user!.id)
            ])
            setAppointments(appsData.content)
            setPrescriptionCount(presData.totalElements || presData.content?.length || 0)
        } catch (err) {
            console.error("Failed to fetch dashboard data", err)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    const upcomingAppointments = appointments.filter(app => app.status === 'SCHEDULED' || app.status === 'CONFIRMED')

    return (
        <DashboardLayout role="patient">
            <div className="space-y-8">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Bonjour, {user.firstName} 👋
                        </h1>
                        <p className="text-slate-500 mt-1">Comment vous sentez-vous aujourd'hui ?</p>
                    </div>
                    <Link
                        href="/patient/appointments"
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <Calendar className="w-5 h-5" />
                        Prendre un rendez-vous
                    </Link>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Prochains RDV"
                        value={upcomingAppointments.length}
                        icon={Calendar}
                        variant="primary"
                    />
                    <StatsCard
                        title="Ordonnances Actives"
                        value={prescriptionCount}
                        icon={Pill}
                        variant="success"
                    />
                    <StatsCard
                        title="Documents Médicaux"
                        value={5} // Mock for now
                        icon={FileText}
                        variant="default"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Appointments List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Vos prochains rendez-vous</h2>
                            <Link href="/patient/appointments" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
                                Voir tout <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 italic">
                                    Chargement de vos rendez-vous...
                                </div>
                            ) : upcomingAppointments.length === 0 ? (
                                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
                                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500">Aucun rendez-vous planifié.</p>
                                    <Link href="/patient/appointments" className="text-primary font-bold mt-2 inline-block">
                                        Réserver maintenant
                                    </Link>
                                </div>
                            ) : (
                                upcomingAppointments.map((app, idx) => (
                                    <motion.div
                                        key={app.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                                            <span className="text-xs font-bold uppercase">{new Date(app.appointmentDateTime).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                            <span className="text-xl font-bold leading-none">{new Date(app.appointmentDateTime).getDate()}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">Dr. {app.doctorName || "Médecin"}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(app.appointmentDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    Généraliste
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {app.status}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Use PatientAppointments Component */}
                        <PatientAppointments />
                    </div>

                    {/* Quick Access Sidebar */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Accès Rapide</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <Link href="/patient/dossier" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-800">Mon Dossier</span>
                                    <p className="text-xs text-slate-500">Historique et documents</p>
                                </div>
                            </Link>

                            <Link href="/patient/prescriptions" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                    <Pill className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-800">Ordonnances</span>
                                    <p className="text-xs text-slate-500">Traitements en cours</p>
                                </div>
                            </Link>

                            <div className="p-4 bg-gradient-to-br from-primary to-teal-500 rounded-2xl shadow-lg shadow-primary/20 text-white flex flex-col items-center text-center space-y-3">
                                <Activity className="w-10 h-10 opacity-50" />
                                <h4 className="font-bold">Téléconsultation</h4>
                                <p className="text-xs text-white/80">Besoin d'un avis rapide ? Parlez à un médecin en ligne.</p>
                                <button className="w-full py-2 bg-white text-primary rounded-lg font-bold text-sm">
                                    Démarrer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
