"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { patientApi, UserResponse } from "@/lib/api"
import { Search, User, Filter, ChevronRight, Activity, Calendar } from "lucide-react"
import { motion } from "framer-motion"

export default function MedecinPatients() {
    const [patients, setPatients] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchPatients()
    }, [])

    async function fetchPatients() {
        setLoading(true)
        try {
            // Updated to use the secure patientApi
            const data = await patientApi.getPatients(0, 50)
            setPatients(data.content)
        } catch (err) {
            console.error("Failed to fetch patients", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(p =>
        p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <DashboardLayout role="medecin">
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ma File de Patients</h1>
                    <p className="text-slate-500">Recherchez et gérez les dossiers médicaux de vos patients</p>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par nom, email ou ID..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all">
                        <Filter className="w-4 h-4" />
                        Filtres
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-400 italic">Chargement des patients...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPatients.map((patient, idx) => (
                            <motion.div
                                key={patient.keycloakId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {patient.firstName[0]}{patient.lastName[0]}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dernière visite</span>
                                            <p className="text-xs font-semibold text-slate-700 mt-1">12 Jan 2026</p>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-slate-800 text-lg mb-1">{patient.firstName} {patient.lastName}</h3>
                                    <p className="text-xs text-slate-500 mb-4">{patient.email}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-2 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Groupe Sanguin</p>
                                            <p className="text-sm font-bold text-slate-700">O+</p>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">RDV Total</p>
                                            <p className="text-sm font-bold text-slate-700">12</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => window.location.href = `/medecin/patients/${patient.keycloakId}`}
                                        className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-primary transition-all"
                                    >
                                        Consulter le Dossier
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
