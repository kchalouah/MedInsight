"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { mlApi } from "@/lib/api"
import { motion } from "framer-motion"
import { Sparkles, Send, FileText } from "lucide-react"
import toast from "react-hot-toast"

export default function AssistantPage() {
    const [symptoms, setSymptoms] = useState("")
    const [diagnosis, setDiagnosis] = useState<any>(null)
    const [treatment, setTreatment] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const handlePredict = async () => {
        if (!symptoms.trim()) {
            toast.error("Veuillez saisir des symptômes")
            return
        }

        setLoading(true)
        try {
            const diagResult = await mlApi.predictDiagnosis({ symptoms })
            setDiagnosis(diagResult)

            const treatResult = await mlApi.suggestTreatment({
                symptoms,
                diagnosis: diagResult.diagnosis
            })
            setTreatment(treatResult)

            toast.success("Analyse terminée")
        } catch (error) {
            toast.error("Erreur lors de l'analyse")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout role="medecin">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-primary" />
                        Assistant IA Médical
                    </h1>
                    <p className="text-slate-600">Analyse des symptômes et suggestions de diagnostic</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-card">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <FileText className="inline w-4 h-4 mr-1" />
                        Symptômes du patient
                    </label>
                    <textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Ex: Fièvre depuis 3 jours, maux de tête, toux sèche..."
                        className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    <button
                        onClick={handlePredict}
                        disabled={loading}
                        className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {loading ? "Analyse en cours..." : "Analyser"}
                    </button>
                </div>

                {diagnosis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-3">Diagnostic Suggéré</h3>
                            <p className="text-blue-800">{diagnosis.diagnosis || "Non disponible"}</p>
                            {diagnosis.confidence && (
                                <p className="text-sm text-blue-600 mt-2">
                                    Confiance: {(diagnosis.confidence * 100).toFixed(0)}%
                                </p>
                            )}
                        </div>

                        {treatment && (
                            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-green-900 mb-3">Traitement Suggéré</h3>
                                <p className="text-green-800">{treatment.treatment || "Non disponible"}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Avertissement:</strong> Les suggestions de l'IA sont à titre informatif uniquement.
                        Elles ne remplacent pas le jugement clinique du médecin.
                    </p>
                </div>
            </motion.div>
        </DashboardLayout>
    )
}
