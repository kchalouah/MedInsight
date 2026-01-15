"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useAuth } from "@/lib/auth-context"
import { appointmentApi, AppointmentResponse } from "@/lib/api"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, FileText } from "lucide-react"
import { motion } from "framer-motion"

export default function DoctorAppointmentsPage() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState("ALL")
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

    useEffect(() => {
        if (user?.id) { // Assuming user.id corresponds to doctor's Keycloak ID which should be linked to doctorId logic in backend
            // Ideally fetching by doctorId. 
            // IMPORTANT: API might expect valid UUID for doctorId. 
            // If user.id is keycloak ID, backend might handle it or we need a profile lookup.
            // For now assuming user.id is usable or we filter by logged in user context in backend if available.
            // The backend `getAppointments` checks roles. If I am a doctor, `getAppointments` might implicitly filter or allow me to see all?
            // The doc says `GET /doctor/{doctorId}`. Let's try to use filters with user.keycloakId if backend supports it or filter frontend side if we must.
            // Best bet: passing doctorId=user.keycloakId to getAppointments.
            fetchAppointments()
        }
    }, [user, filterStatus, selectedDate])

    async function fetchAppointments() {
        if (!user) return
        setLoading(true)
        try {
            // Fetch appointments for this doctor
            // Backend endpoint: /appointments?doctorId=...
            const data = await appointmentApi.getAppointments({
                doctorId: user.keycloakId, // Using keycloak ID as doctor ID reference
                status: filterStatus !== "ALL" ? filterStatus : undefined,
                // startDate: selectedDate ... (Implement date filtering if backend supports ISO range)
                size: 50 // Fetch enough for daily view
            })
            setAppointments(data.content)
        } catch (err) {
            console.error("Failed to fetch appointments", err)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        if (!confirm("Voulez-vous vraiment changer le statut de ce rendez-vous ?")) return
        try {
            await appointmentApi.updateAppointment(id, { status: newStatus })
            fetchAppointments() // Refresh
        } catch (err) {
            alert("Erreur lors de la mise à jour")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmé</span>
            case 'COMPLETED': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Terminé</span>
            case 'CANCELLED': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Annulé</span>
            default: return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>
        }
    }

    return (
        <DashboardLayout role="medecin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mes Rendez-vous</h1>
                    <p className="text-slate-500">Gérez votre planning et vos consultations</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                        <Calendar className="text-slate-500 w-4 h-4" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent outline-none text-slate-700 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="text-slate-500 w-4 h-4" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                            <option value="ALL">Tous les statuts</option>
                            <option value="SCHEDULED">En attente / Confirmé</option>
                            <option value="COMPLETED">Terminé</option>
                            <option value="CANCELLED">Annulé</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="grid gap-4">
                    {loading ? (
                        <p className="text-center py-8 text-slate-500">Chargement des rendez-vous...</p>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Aucun rendez-vous trouvé pour cette date.</p>
                        </div>
                    ) : (
                        appointments.map((apt, index) => (
                            <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4"
                            >
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center justify-center bg-blue-50 w-16 h-16 rounded-lg text-blue-700">
                                        <span className="text-xs font-bold uppercase">{new Date(apt.appointmentDateTime).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                        <span className="text-xl font-bold">{new Date(apt.appointmentDateTime).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-slate-900 text-lg">{apt.patientName || "Patient inconnu"}</h3>
                                            {getStatusBadge(apt.status)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {new Date(apt.appointmentDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span>•</span>
                                            <span>{apt.reason}</span>
                                        </div>
                                        {apt.notes && (
                                            <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                                                Note: {apt.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                                    {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(apt.id, 'COMPLETED')}
                                                className="w-full py-2 px-3 bg-primary text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Terminer
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                                                className="w-full py-2 px-3 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                        </>
                                    ) : (
                                        <button className="w-full py-2 px-3 bg-slate-100 text-slate-500 text-sm font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                                            <FileText className="w-4 h-4" /> Détails
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
