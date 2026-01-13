"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PrescriptionDocument from "@/components/ui/PrescriptionDocument"
import { appointmentApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Pill, Search, Calendar, ChevronRight, X, Printer, Download } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function PatientPrescriptions() {
    const { user } = useAuth()
    const [prescriptions, setPrescriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedPrescription, setSelectedPrescription] = useState<any>(null)

    useEffect(() => {
        if (user?.id) {
            fetchPrescriptions()
        }
    }, [user])

    async function fetchPrescriptions() {
        setLoading(true)
        try {
            const data = await appointmentApi.getPatientPrescriptions(user!.id)
            setPrescriptions(data.content || [])
        } catch (err) {
            console.error("Failed to fetch prescriptions", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredPrescriptions = prescriptions.filter(p =>
        p.medicationName.toLowerCase().includes(search.toLowerCase())
    )

    if (!user) return null

    return (
        <DashboardLayout role="patient">
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Pill className="w-7 h-7 text-purple-500" />
                            Mes Ordonnances
                        </h1>
                        <p className="text-slate-500">Gérez et consultez vos ordonnances médicales</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un médicament..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-400 italic">Récupération de vos ordonnances...</div>
                ) : prescriptions.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Pill className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500">Vous n'avez aucune ordonnance enregistrée.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPrescriptions.map((pres, idx) => (
                            <motion.div
                                key={pres.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        <Pill className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Émise le</p>
                                        <p className="text-xs font-bold text-slate-700">{new Date(pres.issuedAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 text-lg mb-2 truncate" title={pres.medicationName}>
                                    {pres.medicationName}
                                </h3>
                                <p className="text-sm text-slate-500 mb-6">{pres.dosage} - {pres.duration}</p>

                                <button
                                    onClick={() => setSelectedPrescription(pres)}
                                    className="w-full py-3 bg-slate-50 text-slate-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-50 hover:text-purple-600 transition-all"
                                >
                                    Afficher l'Ordonnance
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Document Modal */}
            <AnimatePresence>
                {selectedPrescription && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPrescription(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-100 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-8"
                        >
                            {/* Controls Sidebar */}
                            <div className="md:w-48 space-y-3 shrink-0">
                                <button
                                    onClick={() => setSelectedPrescription(null)}
                                    className="w-full p-3 bg-white text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50"
                                >
                                    <X className="w-5 h-5" /> Fermer
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="w-full p-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg shadow-primary/20"
                                >
                                    <Printer className="w-5 h-5" /> Imprimer
                                </button>
                                <button className="w-full p-3 bg-white text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50">
                                    <Download className="w-5 h-5" /> Télécharger
                                </button>
                            </div>

                            {/* Document Preview */}
                            <div className="flex-1 overflow-x-hidden">
                                <PrescriptionDocument prescription={selectedPrescription} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    )
}
