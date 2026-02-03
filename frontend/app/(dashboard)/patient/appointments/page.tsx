"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useRouter } from "next/navigation"
import AppointmentSlotPicker from "@/components/appointments/AppointmentSlotPicker"
import { medecinApi, appointmentApi, mailApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "react-hot-toast"
import {
    Calendar as CalendarIcon, Clock, User,
    Stethoscope, CheckCircle, AlertCircle,
    ArrowLeft, ChevronRight, Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function PatientAppointments() {
    const { user } = useAuth()
    const router = useRouter()
    const [doctors, setDoctors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [booking, setBooking] = useState(false)
    const [step, setStep] = useState(1)

    // Form State
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
    const [appointmentDate, setAppointmentDate] = useState("")
    const [appointmentTime, setAppointmentTime] = useState("")
    const [reason, setReason] = useState("")

    useEffect(() => {
        fetchDoctors()
    }, [])

    async function fetchDoctors() {
        try {
            const data = await medecinApi.getDoctors()
            setDoctors(data.content)
        } catch (err) {
            console.error("Failed to fetch doctors", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleBookAppointment() {
        if (!selectedDoctor || !appointmentDate || !appointmentTime || !reason) {
            toast.error("Veuillez remplir tous les champs.")
            return
        }

        setBooking(true)
        try {
            const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`
            await appointmentApi.createAppointment({
                patientId: user!.id,
                doctorId: selectedDoctor.keycloakId,
                appointmentDateTime,
                reason
            })
            setStep(4) // Success Step

            // Send Email Notification
            if (user?.email) {
                mailApi.sendEmail({
                    to: user.email,
                    subject: "Confirmation de rendez-vous - MedInsight",
                    body: `Bonjour ${user.firstName},\n\nVotre rendez-vous avec le Dr. ${selectedDoctor.lastName} est confirmé pour le ${new Date(appointmentDate).toLocaleDateString('fr-FR')} à ${appointmentTime}.\n\nMotif: ${reason}\n\nMerci de votre confiance,\nL'équipe MedInsight`,
                    isHtml: false
                }).catch(e => console.error("Email notification failed", e))
            }

            toast.success("Rendez-vous réservé avec succès !")
        } catch (err) {
            console.error("Booking failed", err)
            toast.error("Erreur lors de la réservation. Veuillez réessayer.")
        } finally {
            setBooking(false)
        }
    }

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    return (
        <DashboardLayout role="patient">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-7 h-7 text-primary" />
                        Prendre un rendez-vous
                    </h1>
                    <p className="text-slate-500">Choisissez votre médecin et votre créneau horaire</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between px-4 max-w-md mx-auto">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {s}
                            </div>
                            {s < 3 && <div className={`h-1 w-12 mx-2 ${step > s ? 'bg-primary' : 'bg-slate-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[450px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 flex flex-col h-full"
                            >
                                <h2 className="text-xl font-bold text-slate-800 mb-6">Sélectionnez un médecin</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2">
                                    {loading ? (
                                        <div className="col-span-2 text-center py-12 text-slate-400">Chargement des médecins...</div>
                                    ) : doctors.map(doc => (
                                        <button
                                            key={doc.id}
                                            onClick={() => { setSelectedDoctor(doc); nextStep(); }}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${selectedDoctor?.id === doc.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/30 hover:bg-slate-50'}`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
                                                {doc.firstName[0]}{doc.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">Dr. {doc.firstName} {doc.lastName}</p>
                                                <p className="text-xs text-slate-500 mb-2">{doc.medecinProfile?.specialization || "Généraliste"}</p>
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Choisir</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 space-y-6 flex-1 flex flex-col"
                            >
                                <div className="flex-1 space-y-6 overflow-y-auto">
                                    <h2 className="text-xl font-bold text-slate-800">Choisissez un créneau</h2>
                                    <AppointmentSlotPicker
                                        doctorId={selectedDoctor?.keycloakId}
                                        selectedSlot={appointmentDate && appointmentTime ? new Date(`${appointmentDate}T${appointmentTime}:00`) : undefined}
                                        onSlotSelect={(slot) => {
                                            const dateStr = slot.toISOString().split('T')[0];
                                            const timeStr = slot.toTimeString().slice(0, 5);
                                            setAppointmentDate(dateStr);
                                            setAppointmentTime(timeStr);
                                        }}
                                    />
                                </div>
                                <div className="pt-8 flex justify-between items-center bg-slate-50/50 -mx-8 -mb-8 p-8 border-t border-slate-100 mt-auto">
                                    <button
                                        onClick={prevStep}
                                        className="text-slate-600 hover:text-slate-800 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 shadow-sm"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour
                                    </button>
                                    <button
                                        disabled={!appointmentDate || !appointmentTime}
                                        onClick={nextStep}
                                        className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        Suivant
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 space-y-6 flex-1 flex flex-col"
                            >
                                <div className="flex-1 space-y-6">
                                    <h2 className="text-xl font-bold text-slate-800">Confirmation</h2>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-primary" />
                                            <span className="font-medium text-slate-700">Médecin : Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CalendarIcon className="w-5 h-5 text-primary" />
                                            <span className="font-medium text-slate-700">Date : {new Date(appointmentDate).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <span className="font-medium text-slate-700">Heure : {appointmentTime}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Motif de la consultation</label>
                                        <textarea
                                            placeholder="Décrivez brièvement votre besoin..."
                                            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none h-32"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="pt-8 flex gap-4 bg-slate-50/50 -mx-8 -mb-8 p-8 border-t border-slate-100 mt-auto">
                                    <button
                                        onClick={prevStep}
                                        className="text-slate-500 hover:text-slate-700 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour
                                    </button>
                                    <button
                                        disabled={booking || !reason}
                                        onClick={handleBookAppointment}
                                        className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {booking ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Réservation...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Confirmer le rendez-vous
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 flex flex-col items-center justify-center h-full text-center space-y-4"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Rendez-vous Confirmé !</h2>
                                <p className="text-slate-600 max-w-sm">
                                    Votre rendez-vous a été enregistré avec succès. Vous recevrez une confirmation par email sous peu.
                                </p>
                                <div className="pt-6 w-full max-w-xs">
                                    <button
                                        onClick={() => router.push('/patient/dashboard')}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                                    >
                                        Retour au tableau de bord
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    )
}
