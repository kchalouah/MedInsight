"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { appointmentApi, AppointmentResponse } from "@/lib/api"
import { Calendar, Clock, User, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"

export default function PatientAppointments() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.keycloakId) return

        const fetchAppointments = async () => {
            try {
                const response = await appointmentApi.getAppointments({
                    patientId: user.keycloakId,
                    page: 0,
                    size: 100
                })
                setAppointments(response.content || [])
            } catch (error) {
                console.error("Failed to load appointments", error)
                toast.error("Erreur lors du chargement des rendez-vous")
            } finally {
                setLoading(false)
            }
        }

        fetchAppointments()
    }, [user])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SCHEDULED": return "bg-blue-100 text-blue-800"
            case "CONFIRMED": return "bg-green-100 text-green-800"
            case "COMPLETED": return "bg-gray-100 text-gray-800"
            case "CANCELLED": return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "SCHEDULED": return "Planifié"
            case "CONFIRMED": return "Confirmé"
            case "COMPLETED": return "Terminé"
            case "CANCELLED": return "Annulé"
            default: return status
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (appointments.length === 0) {
        return (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">Aucun rendez-vous trouvé</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Mes Rendez-vous
            </h2>

            {appointments.map((appointment, index) => (
                <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-slate-900">
                                    Dr. {appointment.doctorName || "Non spécifié"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">
                                    {new Date(appointment.appointmentDateTime).toLocaleString('fr-FR', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </span>
                            </div>

                            {appointment.reason && (
                                <p className="text-sm text-slate-600 mt-2">
                                    <strong>Raison:</strong> {appointment.reason}
                                </p>
                            )}

                            {appointment.notes && (
                                <p className="text-sm text-slate-500 italic mt-1">
                                    Note: {appointment.notes}
                                </p>
                            )}
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
