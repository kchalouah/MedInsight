"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { medicalRecordApi, patientApi } from "@/lib/api"
import {
    FileText, User, Activity, AlertCircle,
    Droplet, Info, Calendar, ArrowLeft, Clipboard
} from "lucide-react"
import { motion } from "framer-motion"

export default function MedecinPatientDossier() {
    const { id } = useParams()
    const router = useRouter()
    const [dossier, setDossier] = useState<any>(null)
    const [patient, setPatient] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchDossier()
        }
    }, [id])

    async function fetchDossier() {
        setLoading(true)
        try {
            // Fetch Clinical Data
            try {
                const data = await medicalRecordApi.getDossier(id as string)
                setDossier(data)
            } catch (err) {
                console.error("Failed to fetch medical record", err)
            }

            // Fetch Personal Info
            try {
                const patientData = await patientApi.getPatient(id as string)
                setPatient(patientData)
            } catch (err) {
                console.error("Failed to fetch patient profile", err)
            }
        } catch (err) {
            console.error("Error loading patient data", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout role={["medecin", "gestionnaire"]}>
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Dossier Médical Patient</h1>
                        <p className="text-slate-500">
                            {loading ? "Chargement..." : `${patient?.firstName || 'Patient'} ${patient?.lastName || 'Introuvable'}`}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-400">Récupération des données cliniques...</div>
                ) : !dossier && !patient ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500">Dossier non trouvé.</p>
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
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-3">Profil Patient</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm text-slate-500">
                                            <Droplet className="w-4 h-4 text-red-500" /> Groupe Sanguin
                                        </span>
                                        <span className="font-bold text-slate-800 bg-red-50 px-2 py-0.5 rounded text-sm">
                                            {dossier?.medicalRecord?.bloodType || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2 text-sm text-slate-500">
                                            <AlertCircle className="w-4 h-4 text-orange-500" /> Allergies
                                        </span>
                                        <p className="text-sm font-medium text-slate-800 bg-orange-50 p-2 rounded-lg mt-1">
                                            {dossier?.medicalRecord?.allergies || "Aucune allergie connue"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2 text-sm text-slate-500">
                                            <Info className="w-4 h-4 text-blue-500" /> Antécédents
                                        </span>
                                        <p className="text-sm font-medium text-slate-800 bg-blue-50 p-2 rounded-lg mt-1">
                                            {dossier?.medicalRecord?.medicalHistory || "Pas d'antécédents majeurs"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 pt-4 border-t border-slate-50">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Contact Urgence</span>
                                        <p className="text-sm font-bold text-slate-800">{dossier?.medicalRecord?.emergencyContactName || "Non renseigné"}</p>
                                        <p className="text-xs text-slate-500">{dossier?.medicalRecord?.emergencyContactPhone}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-800">Historique des Consultations</h3>
                                {(!dossier?.consultationNotes || dossier.consultationNotes.length === 0) ? (
                                    <p className="text-slate-400 italic">Aucune note de consultation disponible.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {dossier.consultationNotes.map((note: any, idx: number) => (
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
                                                            <p className="font-bold text-slate-800">Note Médicale</p>
                                                            <p className="text-xs text-slate-400">
                                                                {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 text-sm italic leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                                    "{note.noteContent}"
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
