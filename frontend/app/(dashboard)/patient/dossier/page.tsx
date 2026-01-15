"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { medicalRecordApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
    FileText, User, Activity, AlertCircle,
    Droplet, Info, Calendar, Clock, Clipboard, ChevronRight,
    Download, Edit, Save, X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-hot-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function PatientDossier() {
    const { user } = useAuth()
    const [dossier, setDossier] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        bloodType: "",
        allergies: "",
        medicalHistory: "",
        emergencyContactName: "",
        emergencyContactPhone: ""
    })

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
            // Initialize form data
            if (data?.medicalRecord) {
                setFormData({
                    bloodType: data.medicalRecord.bloodType || "",
                    allergies: data.medicalRecord.allergies || "",
                    medicalHistory: data.medicalRecord.medicalHistory || "",
                    emergencyContactName: data.medicalRecord.emergencyContactName || "",
                    emergencyContactPhone: data.medicalRecord.emergencyContactPhone || ""
                })
            }
        } catch (err) {
            console.error("Failed to fetch dossier", err)
            toast.error("Erreur de chargement du dossier")
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!dossier) return
        const doc = new jsPDF()

        // Header
        doc.setFillColor(63, 81, 181); // Primary color
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("Dossier Médical - MedInsight", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 30, { align: 'center' });

        // Patient Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`Patient: ${user?.firstName} ${user?.lastName}`, 14, 55);
        doc.text(`Email: ${user?.email}`, 14, 62);

        // Clinical Data Box
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, 70, 182, 40);
        doc.setFontSize(11);
        doc.text(`Groupe Sanguin: ${dossier.medicalRecord?.bloodType || "N/A"}`, 20, 80);
        doc.text(`Allergies: ${dossier.medicalRecord?.allergies || "Néant"}`, 20, 90);
        doc.text(`Historique: ${dossier.medicalRecord?.medicalHistory || "Néant"}`, 20, 100);

        // Consultations
        doc.setFontSize(14);
        doc.text("Historique des Consultations", 14, 125);

        const noteRows = dossier.consultationNotes?.map((note: any) => [
            new Date(note.createdAt).toLocaleDateString('fr-FR'),
            note.noteContent
        ]) || [];

        autoTable(doc, {
            startY: 130,
            head: [['Date', 'Observations']],
            body: noteRows,
        });

        // Prescriptions
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.text("Ordonnances Actives", 14, finalY);

        const presRows = dossier.prescriptions?.map((p: any) => [
            p.medicationName,
            p.dosage,
            p.duration
        ]) || [];

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Médicament', 'Posologie', 'Durée']],
            body: presRows,
        });

        doc.save(`dossier_medical_${user?.lastName}.pdf`);
    }

    const handleSave = async () => {
        try {
            await medicalRecordApi.updateDossier(user!.id, formData)
            toast.success("Dossier mis à jour avec succès!")
            setIsEditing(false)
            fetchDossier() // Refresh
        } catch (err) {
            console.error("Failed to update dossier", err)
            toast.error("Échec de la mise à jour")
        }
    }

    if (!user) return null

    return (
        <DashboardLayout role="patient">
            <div className="space-y-8 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-7 h-7 text-primary" />
                            Mon Dossier Médical
                        </h1>
                        <p className="text-slate-500">Consultez et gérez vos informations de santé</p>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" /> Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    <Save className="w-4 h-4" /> Enregistrer
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Modifier
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                >
                                    <Download className="w-4 h-4" /> Télécharger PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400 italic">
                        Chargement de votre dossier...
                    </div>
                ) : !dossier ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500">Aucun dossier médical trouvé.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Clinical Data Column */}
                        <div className="space-y-6">
                            <motion.div
                                layout
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5"
                            >
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center justify-between">
                                    Profil Clinique
                                    {isEditing && <span className="text-xs text-emerald-500 font-normal animate-pulse">Mode édition</span>}
                                </h3>

                                <div className="space-y-4">
                                    {/* Blood Type */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                            <Droplet className="w-3 h-3 text-red-500" /> Groupe Sanguin
                                        </label>
                                        {isEditing ? (
                                            <select
                                                value={formData.bloodType}
                                                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                                            >
                                                <option value="">Sélectionner</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </select>
                                        ) : (
                                            <div className="p-3 bg-red-50 rounded-xl text-slate-800 font-bold border border-red-100">
                                                {dossier.medicalRecord?.bloodType || "Non renseigné"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Allergies */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 text-orange-500" /> Allergies
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={formData.allergies}
                                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                                rows={2}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none"
                                            />
                                        ) : (
                                            <div className="p-3 bg-orange-50 rounded-xl text-slate-800 font-medium border border-orange-100 text-sm">
                                                {dossier.medicalRecord?.allergies || "Aucune allergie signalée"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Medical History */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                            <Info className="w-3 h-3 text-blue-500" /> Antécédents
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={formData.medicalHistory}
                                                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                                                rows={3}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none"
                                            />
                                        ) : (
                                            <div className="p-3 bg-blue-50 rounded-xl text-slate-700 text-sm border border-blue-100 leading-relaxed">
                                                {dossier.medicalRecord?.medicalHistory || "Aucun antécédent majeur"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="pt-4 border-t border-slate-50">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Contact Urgence</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        placeholder="Nom du contact"
                                                        value={formData.emergencyContactName}
                                                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                    />
                                                    <input
                                                        placeholder="Téléphone"
                                                        value={formData.emergencyContactPhone}
                                                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                    />
                                                </>
                                            ) : (
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{dossier.medicalRecord?.emergencyContactName || "Non renseigné"}</p>
                                                    <p className="text-xs text-slate-500">{dossier.medicalRecord?.emergencyContactPhone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Consultations */}
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-4">Historique des Consultations</h3>
                                <div className="space-y-4">
                                    {dossier.consultationNotes?.length > 0 ? (
                                        dossier.consultationNotes.map((note: any, idx: number) => (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <Clipboard className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">Note Clinique</p>
                                                        <p className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 text-sm italic bg-slate-50 p-3 rounded-lg border-l-2 border-primary">
                                                    "{note.noteContent}"
                                                </p>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 italic">Aucune consultation enregistrée.</p>
                                    )}
                                </div>
                            </div>

                            {/* Prescriptions */}
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-4">Ordonnances</h3>
                                {dossier.prescriptions?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {dossier.prescriptions.map((pres: any) => (
                                            <div key={pres.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{pres.medicationName}</p>
                                                    <p className="text-xs text-slate-500">{pres.dosage} - {pres.duration}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic">Aucune ordonnance.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
