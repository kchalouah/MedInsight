"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { medecinApi, UserResponse } from "@/lib/api"
import { Search, User, Stethoscope, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function GestionnaireMedecinsPage() {
    const [medecins, setMedecins] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchMedecins()
    }, [])

    async function fetchMedecins() {
        setLoading(true)
        try {
            const data = await medecinApi.getDoctors(0, 100)
            setMedecins(data.content)
        } catch (err) {
            console.error("Failed to fetch medecins", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredMedecins = medecins.filter(m =>
        m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout role="gestionnaire">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gestion des Médecins</h1>
                    <p className="text-slate-600 mt-1">Consultez et gérez la liste des praticiens de la clinique</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un médecin par nom ou email..."
                        className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-xl focus:border-primary outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 italic">Chargement...</div>
                        ) : filteredMedecins.map((medecin) => (
                            <div key={medecin.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                                        Dr. {medecin.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Dr. {medecin.firstName} {medecin.lastName}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            {medecin.email}
                                            {medecin.medecinProfile?.specialization && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span className="flex items-center gap-1 text-primary font-medium">
                                                        <Stethoscope className="w-3 h-3" /> {medecin.medecinProfile.specialization}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/common/medecins/${medecin.keycloakId}`}
                                        className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/5 rounded-lg transition-all text-sm font-bold"
                                    >
                                        <User className="w-4 h-4" />
                                        Profil Complet
                                    </Link>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                            </div>
                        ))}
                        {!loading && filteredMedecins.length === 0 && (
                            <div className="p-12 text-center text-slate-400 italic">
                                Aucun médecin trouvé.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
