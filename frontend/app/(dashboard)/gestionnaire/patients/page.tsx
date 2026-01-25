"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { patientApi, UserResponse } from "@/lib/api"
import { Search, User, FileText, ChevronRight, Droplet, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"

export default function GestionnairePatientsPage() {
    const [patients, setPatients] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchPatients()
    }, [])

    async function fetchPatients() {
        setLoading(true)
        try {
            // Optimized: Fetching specifically patients from backend
            const data = await patientApi.getPatients(0, 100)
            setPatients(data.content)
        } catch (err) {
            console.error("Failed to fetch patients", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(p =>
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout role="gestionnaire">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gestion des Patients</h1>
                    <p className="text-slate-600 mt-1">Consultez et gérez les dossiers médicaux des patients</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un patient par nom ou email..."
                        className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-xl focus:border-primary outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 italic">Chargement...</div>
                        ) : filteredPatients.map((patient) => (
                            <div key={patient.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                                        {patient.firstName[0]}{patient.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{patient.firstName} {patient.lastName}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            {patient.email}
                                            {patient.patientProfile?.bloodType && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span className="flex items-center gap-1 text-red-500 font-bold">
                                                        <Droplet className="w-3 h-3" /> {patient.patientProfile.bloodType}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/medecin/patients/${patient.keycloakId}`}
                                        className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/5 rounded-lg transition-all text-sm font-bold"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Dossier Médical
                                    </Link>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                            </div>
                        ))}
                        {!loading && filteredPatients.length === 0 && (
                            <div className="p-12 text-center text-slate-400 italic">
                                Aucun patient trouvé.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
