"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { medicalRecordApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
    FileText, User, Activity, AlertCircle,
    Droplet, Info, Calendar, Clock, Clipboard, ChevronRight
} from "lucide-react"
import { motion } from "framer-motion"

export default function PatientDossier() {
    const { user } = useAuth()
    const [dossier, setDossier] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user?.id) {
            fetchDossier()
        }
    }, [user])

    async function fetchDossier() {
        setLoading(true)
        try {
            const data = await medicalRecordApi.getDossier(user!.id)
            setDossier(data)
        } catch (err) {
            console.error("Failed to fetch dossier", err)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <DashboardLayout role="patient">
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-primary" />
                        Mon Dossier Médical
                    </h1>
                    <p className="text-slate-500">Consultez vos informations cliniques et votre historique</p>
                </div>

                {loading ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400 italic">
                        Récupération de vos données sécurisées...
                    </div>
                ) : !dossier ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500">Aucun dossier médical trouvé pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary Sidebar */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                            >
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-3">Profil Médical</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm text-slate-500">
                                            <Droplet className="w-4 h-4 text-red-500" /> Groupe Sanguin
                                        </span>
                                        <span className="font-bold text-slate-800 bg-red-50 px-2 py-0.5 rounded text-sm">
                                            {dossier.bloodType || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2 text-sm text-slate-500">
                                            <AlertCircle className="w-4 h-4 text-orange-500" /> Allergies
                                        </span>
                                        <p className="text-sm font-medium text-slate-800 bg-orange-50 p-2 rounded-lg mt-1">
                                            {dossier.allergies || "Aucune allergie connue"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2 text-sm text-slate-500">
                                            <Info className="w-4 h-4 text-blue-500" /> Antécédents
                                        </span>
                                        <p className="text-sm font-medium text-slate-800 bg-blue-50 p-2 rounded-lg mt-1">
                                            {dossier.medicalHistory || "Pas d'antécédents majeurs"}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="p-6 bg-primary/10 rounded-3xl flex items-center gap-4 border border-primary/20">
                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                                    <Droplet className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">Prise de rendez-vous</h4>
                                    <p className="text-xs text-slate-500">Planifier votre prochaine visite</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Notes & Prescriptions */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Consultation Notes */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-800">Historique des Consultations</h3>
                                <div className="space-y-4">
                                    {dossier.consultationNotes?.length === 0 ? (
                                        <p className="text-slate-400 italic">Aucune note de consultation disponible.</p>
                                    ) : (
                                        dossier.consultationNotes?.map((note: any, idx: number) => (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <Clipboard className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">Consultation Médicale</p>
                                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 12/01/2026</span>
                                                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Dr. Mansour</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 text-sm italic leading-relaxed bg-slate-50 p-4 rounded-xl border-l-4 border-primary">
                                                    "{note.noteContent}"
                                                </p>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Prescriptions */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-800">Dernières Ordonnances</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dossier.prescriptions?.length === 0 ? (
                                        <p className="text-slate-400 italic">Aucune ordonnance émise.</p>
                                    ) : (
                                        dossier.prescriptions?.map((pres: any, idx: number) => (
                                            <motion.div
                                                key={pres.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4"
                                            >
                                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800">{pres.medicationName}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{pres.dosage} - {pres.duration}</p>
                                                    <button
                                                        onClick={() => window.location.href = '/patient/prescriptions'}
                                                        className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1 hover:underline"
                                                    >
                                                        Détails <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
