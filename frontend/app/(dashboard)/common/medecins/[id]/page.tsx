"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { adminApi } from "@/lib/api"
import {
    User, Mail, Phone, MapPin, Calendar,
    Stethoscope, Award, BookOpen, ArrowLeft, Shield
} from "lucide-react"
import { motion } from "framer-motion"

export default function MedecinProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const [doctor, setDoctor] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchDoctor()
        }
    }, [id])

    async function fetchDoctor() {
        setLoading(true)
        try {
            // Use the new adminApi method (works for GESTIONNAIRE too)
            const data = await adminApi.getUsers(0, 500) // fallback if detail not found
            const found = data.content.find((u: any) => u.keycloakId === id)
            setDoctor(found)
        } catch (err) {
            console.error("Failed to fetch doctor profile", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout role={["admin", "gestionnaire", "medecin"]}>
                <div className="py-20 text-center text-slate-400">Chargement du profil...</div>
            </DashboardLayout>
        )
    }

    if (!doctor) {
        return (
            <DashboardLayout role={["admin", "gestionnaire", "medecin"]}>
                <div className="py-20 text-center text-slate-400">Médecin non trouvé.</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout role={["admin", "gestionnaire", "medecin"]}>
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Profil Praticien</h1>
                        <p className="text-slate-500">Informations détaillées du médecin</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center"
                        >
                            <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                                {doctor.firstName[0]}{doctor.lastName[0]}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                Dr. {doctor.firstName} {doctor.lastName}
                            </h2>
                            <p className="text-primary font-medium mt-1">{doctor.specialization || "Spécialiste"}</p>

                            <div className="mt-8 pt-8 border-t border-slate-50 space-y-4 text-left">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-4 h-4 text-slate-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email</p>
                                        <p className="text-sm text-slate-700">{doctor.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-slate-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Téléphone</p>
                                        <p className="text-sm text-slate-700">{doctor.phoneNumber || "Non renseigné"}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Professional Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Informations Professionnelles
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Numéro de Licence</p>
                                        <p className="text-slate-700 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-primary" />
                                            {doctor.licenseNumber || "LIC-98234-X"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Années d'expérience</p>
                                        <p className="text-slate-700 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {doctor.yearsOfExperience || 12} ans
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Localisation</p>
                                        <p className="text-slate-700 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            {doctor.city || "Abidjan"}, {doctor.country || "Côte d'Ivoire"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Statut du Compte</p>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                            ACTIF
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-50">
                                <h4 className="font-bold text-slate-900 mb-4">À propos</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Le Dr. {doctor.lastName} est un praticien dévoué avec une vaste expérience en {doctor.specialization || "médecine moderne"}.
                                    Reconnu pour son approche centrée sur le patient et son expertise clinique, il contribue activement à l'excellence
                                    des soins au sein de la clinique MedInsight.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
