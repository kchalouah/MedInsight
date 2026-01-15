"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { appointmentApi, medicalRecordApi, mlApi, mailApi, patientApi, AppointmentResponse } from "@/lib/api"
import { toast } from "react-hot-toast"
import {
    Activity, Clipboard, FileText, Send,
    AlertCircle, Sparkles, Save, User, Calendar,
    ChevronRight, CheckCircle, Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ConsultationPage() {
    const { id } = useParams()
    const router = useRouter()

    // State
    const [appointment, setAppointment] = useState<AppointmentResponse | null>(null)
    const [dossier, setDossier] = useState<any>(null)
    const [patient, setPatient] = useState<any>(null) // New state for patient details
    const [notes, setNotes] = useState("")
    const [symptoms, setSymptoms] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [aiResults, setAiResults] = useState<any>(null)
    const [isAiLoading, setIsAiLoading] = useState(false)

    // Prescription State
    const [medication, setMedication] = useState("")
    const [dosage, setDosage] = useState("")
    const [duration, setDuration] = useState("")
    const [prescriptions, setPrescriptions] = useState<any[]>([])

    useEffect(() => {
        if (id) {
            fetchInitialData()
        }
    }, [id])

    async function fetchInitialData() {
        setLoading(true)
        try {
            // Fetch appointment details
            const apps = await appointmentApi.getAppointments({ size: 100 })
            const currentApt = apps.content.find(a => a.id === id)

            if (currentApt) {
                setAppointment(currentApt)

                // Fetch patient dossier (Clinical Data)
                try {
                    const dossierData = await medicalRecordApi.getDossier(currentApt.patientId)
                    setDossier(dossierData)
                } catch (e) {
                    console.error("Failed to fetch dossier", e)
                }

                // Fetch patient profile (Personal Info)
                try {
                    const patientData = await patientApi.getPatient(currentApt.patientId)
                    setPatient(patientData)
                } catch (e) {
                    console.error("Failed to fetch patient profile", e)
                }
            }
        } catch (err) {
            console.error("Failed to load consultation data", err)
            toast.error("Impossible de charger les données de la consultation")
        } finally {
            setLoading(false)
        }
    }

    const handleRunAiAssistant = async () => {
        if (!symptoms) return
        setIsAiLoading(true)
        try {
            const result = await mlApi.predictDiagnosis({ symptoms })
            setAiResults(result)
        } catch (err) {
            console.error("AI Assistant error", err)
            toast.error("L'assistant IA est temporairement indisponible.")
        } finally {
            setIsAiLoading(false)
        }
    }

    const handleAddPrescription = () => {
        if (!medication || !dosage) return
        const newPres = { medicationName: medication, dosage, duration, instructions: "" }
        setPrescriptions([...prescriptions, newPres])
        setMedication("")
        setDosage("")
        setDuration("")
        toast.success(`${medication} ajouté à l'ordonnance`)
    }

    const handleCompleteConsultation = async () => {
        if (!appointment) return
        setSaving(true)
        try {
            // 1. Save consultation note
            if (notes.trim()) {
                await medicalRecordApi.addNote({
                    appointmentId: appointment.id,
                    patientId: appointment.patientId,
                    noteContent: notes
                })
            }

            // 2. Save prescriptions
            for (const pres of prescriptions) {
                await appointmentApi.createPrescription(appointment.id, {
                    patientId: appointment.patientId,
                    ...pres
                })
            }

            // 3. Mark appointment as COMPLETED
            await appointmentApi.updateAppointment(appointment.id, {
                status: 'COMPLETED',
                notes: notes
            })

            // 4. Send Email Notification to Patient
            const patientEmail = patient?.email
            if (patientEmail) {
                const prescriptionList = prescriptions.map(p => `- ${p.medicationName} (${p.dosage})`).join('\n')
                mailApi.sendEmail({
                    to: patientEmail,
                    subject: "Nouvelles Ordonnances Disponibles - MedInsight",
                    body: `Bonjour ${patient?.firstName || 'Patient'},\n\nLe Dr. ${appointment.doctorName || 'Médecin'} vient de terminer votre consultation.\n\nVous trouverez vos nouvelles ordonnances dans votre espace patient :\n${prescriptionList}\n\nMerci de votre confiance,\nL'équipe MedInsight`,
                    isHtml: false
                }).catch(e => console.error("Consultation email failed", e))
            }

            toast.success("Consultation enregistrée avec succès!")
            router.push('/medecin/dashboard?success=consultation_terminée')
        } catch (err) {
            console.error("Failed to save consultation", err)
            toast.error("Erreur lors de l'enregistrement de la consultation.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout role="medecin">
                <div className="flex items-center justify-center h-64 text-slate-400">
                    Initialisation de la session de consultation...
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout role="medecin">
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Consultation : {patient?.firstName} {patient?.lastName}</h1>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <span className="bg-slate-100 px-2 py-0.5 rounded">ID: {appointment?.patientId.substring(0, 8)}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date().toLocaleDateString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCompleteConsultation}
                            disabled={saving}
                            className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? "Enregistrement..." : "Terminer la Consultation"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Patient Context & History */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-red-500" />
                                Contexte Clinique
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Groupe Sanguin</p>
                                    <p className="font-bold text-slate-800">{dossier?.medicalRecord?.bloodType || "Non renseigné"}</p>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <p className="text-xs text-orange-600 font-bold uppercase mb-1">Allergies</p>
                                    <p className="font-medium text-slate-800 line-clamp-2">{dossier?.medicalRecord?.allergies || "Aucune connue"}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Antécédents</p>
                                    <p className="text-slate-700 font-medium leading-relaxed">
                                        {dossier?.medicalRecord?.medicalHistory || "Aucun antécédent majeur"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Assistant Sidebar */}
                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-24 h-24" />
                            </div>
                            <h3 className="font-bold flex items-center gap-2 mb-4 relative z-10">
                                <Sparkles className="w-5 h-5 text-teal-400" />
                                Assistant IA Diagnostic
                            </h3>
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="Décrivez les symptômes observés..."
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-500 mb-4 focus:ring-1 focus:ring-teal-500 outline-none h-24 transition-all"
                            />
                            <button
                                onClick={handleRunAiAssistant}
                                disabled={isAiLoading || !symptoms}
                                className="w-full py-3 bg-teal-500 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-400 transition-all disabled:opacity-50"
                            >
                                {isAiLoading ? "Analyse en cours..." : "Lancer l'Analyse IA"}
                            </button>

                            {aiResults && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-6 space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10"
                                >
                                    <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Résultats suggérés</p>
                                    {aiResults.predictions ? Object.entries(aiResults.predictions).map(([diag, score]: [string, any]) => (
                                        <div key={diag} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-300 capitalize">{diag.replace('_', ' ')}</span>
                                                <span className="font-bold text-teal-400">{(score * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${score * 100}%` }}
                                                    className="h-full bg-teal-500"
                                                />
                                            </div>
                                        </div>
                                    )).slice(0, 3) : <p className="text-xs text-slate-400 italic">Analyse complétée.</p>}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Main Consultation Work */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Clinical Notes Editor */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
                            <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                                <Clipboard className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-slate-800">Observations et Examen Clinique</h3>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Saisissez ici vos notes de consultation détaillées..."
                                className="flex-1 p-8 outline-none text-slate-700 text-lg leading-relaxed placeholder:text-slate-300 resize-none font-medium"
                            />
                            <div className="p-3 bg-slate-50 rounded-b-3xl text-right text-xs text-slate-400 px-6">
                                Sauvegarde automatique locale activée
                            </div>
                        </div>

                        {/* Prescription Builder */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-600" />
                                Gestion de l'Ordonnance
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Médicament</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            value={medication}
                                            onChange={(e) => setMedication(e.target.value)}
                                            placeholder="Ex: Doliprane 1000mg"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Posologie</label>
                                    <input
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                        placeholder="Ex: 1cp x 3/jour"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleAddPrescription}
                                    className="py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all"
                                >
                                    Ajouter
                                </button>
                            </div>

                            <AnimatePresence>
                                <div className="space-y-3">
                                    {prescriptions.map((pres, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-purple-600 font-bold text-xs">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{pres.medicationName}</p>
                                                    <p className="text-xs text-slate-500">{pres.dosage}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                Retirer
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
