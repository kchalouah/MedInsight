"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { medicalRecordApi, appointmentApi } from "@/lib/api"
import { ArrowLeft, FileText, Activity, AlertCircle, Plus, Calendar } from "lucide-react"

export default function PatientDossierPage() {
    const params = useParams()
    const router = useRouter()
    const patientId = params.id as string

    const [dossier, setDossier] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        if (patientId) {
            fetchDossier()
        }
    }, [patientId])

    async function fetchDossier() {
        setLoading(true)
        try {
            const data = await medicalRecordApi.getDossier(patientId)
            setDossier(data)
        } catch (err) {
            console.error("Failed to fetch dossier", err)
            setError("Impossible de charger le dossier médical.")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <DashboardLayout role="medecin">
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Chargement du dossier...</p>
            </div>
        </DashboardLayout>
    )

    if (error || !dossier) return (
        <DashboardLayout role="medecin">
            <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {error || "Dossier introuvable"}
            </div>
            <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">
                Retour
            </button>
        </DashboardLayout>
    )

    return (
        <DashboardLayout role="medecin">
            <div className="space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Retour à la liste
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            Dossier Médical
                        </h1>
                        <p className="text-slate-500">Patient: <span className="font-semibold text-slate-900">{dossier.patientName || "Inconnu"}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Clinical Profile */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-red-500" />
                                Informations Cliniques
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Groupe Sanguin</label>
                                    <p className="text-lg font-semibold text-slate-800">{dossier.bloodType || "Non renseigné"}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Allergies</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {dossier.allergies ? (
                                            dossier.allergies.split(',').map((a: string, i: number) => (
                                                <span key={i} className="bg-red-50 text-red-700 px-2 py-1 rounded text-sm">{a.trim()}</span>
                                            ))
                                        ) : <span className="text-slate-500 text-sm">Aucune</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Conditions Chroniques</label>
                                    <ul className="mt-1 list-disc list-inside text-slate-700 text-sm">
                                        {dossier.chronic_conditions ? (
                                            dossier.chronic_conditions.split(',').map((c: string, i: number) => (
                                                <li key={i}>{c.trim()}</li>
                                            ))
                                        ) : <li>Aucune condition signalée</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Recent Prescriptions */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-4">Prescriptions Récentes</h3>
                            {dossier.prescriptions && dossier.prescriptions.length > 0 ? (
                                <ul className="space-y-3">
                                    {dossier.prescriptions.slice(0, 3).map((p: any, i: number) => (
                                        <li key={i} className="bg-slate-50 p-3 rounded-lg text-sm">
                                            <p className="font-semibold text-slate-800">{p.medicationName}</p>
                                            <p className="text-slate-500">{p.dosage} - {p.duration}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-sm italic">Aucune prescription récente.</p>
                            )}
                        </div>
                    </div>

                    {/* Timeline / Notes */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900">Consultations & Notes</h3>
                                <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Ajouter une note
                                </button>
                            </div>

                            {/* Assuming dossier.appointments or dossier.notes contains history */}
                            <div className="space-y-6">
                                {dossier.medicalHistory ? (
                                    <div className="relative border-l-2 border-slate-200 pl-6 pb-6">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200" />
                                        <p className="text-slate-500 text-sm">Historique Initial</p>
                                        <p className="text-slate-800 mt-1">{dossier.medicalHistory}</p>
                                    </div>
                                ) : null}

                                {/* Only static rendering if array missing, checking if dossier.notes exists */}
                                {(!dossier.notes || dossier.notes.length === 0) && (
                                    <p className="text-center py-8 text-slate-500">Aucune note de consultation disponible.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
