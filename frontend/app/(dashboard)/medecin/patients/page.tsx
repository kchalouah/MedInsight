"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useAuth } from "@/lib/auth-context"
import { appointmentApi, AppointmentResponse } from "@/lib/api"
import { Search, User, FileText, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface PatientSummary {
    id: string
    name: string
    lastAppointment: string
}

export default function MyPatientsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [patients, setPatients] = useState<PatientSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (user) {
            fetchMyPatients()
        }
    }, [user])

    async function fetchMyPatients() {
        if (!user) return
        setLoading(true)
        try {
            // Fetch all appointments to derive patient list
            // Optimization: Backend should ideally provide /doctor/{id}/patients
            const data = await appointmentApi.getAppointments({
                doctorId: user.keycloakId,
                size: 100 // Fetch a decent batch to find unique patients
            })

            const uniquePatients = new Map<string, PatientSummary>()

            data.content.forEach((apt: AppointmentResponse) => {
                if (apt.patientId && !uniquePatients.has(apt.patientId)) {
                    uniquePatients.set(apt.patientId, {
                        id: apt.patientId,
                        name: apt.patientName || "Patient Inconnu",
                        lastAppointment: apt.appointmentDateTime
                    })
                } else if (apt.patientId && uniquePatients.has(apt.patientId)) {
                    // Update last appointment if this one is more recent
                    const existing = uniquePatients.get(apt.patientId)!
                    if (new Date(apt.appointmentDateTime) > new Date(existing.lastAppointment)) {
                        existing.lastAppointment = apt.appointmentDateTime
                        uniquePatients.set(apt.patientId, existing)
                    }
                }
            })

            setPatients(Array.from(uniquePatients.values()))
        } catch (err) {
            console.error("Failed to fetch patients", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout role="medecin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mes Patients</h1>
                    <p className="text-slate-500">Accédez aux dossiers médicaux de vos patients</p>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher un patient par nom..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Patient List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <p className="col-span-full text-center py-8 text-slate-500">Chargement de vos patients...</p>
                    ) : filteredPatients.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Aucun patient trouvé.</p>
                        </div>
                    ) : (
                        filteredPatients.map(patient => (
                            <div
                                key={patient.id}
                                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{patient.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            Dernier RDV: {new Date(patient.lastAppointment).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/medecin/patients/${patient.id}`)}
                                    className="w-full py-2 px-3 bg-slate-50 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Voir Dossier
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
