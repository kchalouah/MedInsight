"use client"

import { FileText, User, Calendar, Activity, Pill } from "lucide-react"

interface PrescriptionDocumentProps {
    prescription: {
        medicationName: string;
        dosage: string;
        duration: string;
        instructions?: string;
        issuedAt?: string;
        doctorName?: string;
        patientName?: string;
    }
}

export default function PrescriptionDocument({ prescription }: PrescriptionDocumentProps) {
    return (
        <div className="bg-white p-8 max-w-2xl mx-auto border-2 border-slate-100 shadow-xl rounded-sm font-serif text-slate-800">
            {/* Header / Hospital Branding */}
            <div className="flex justify-between items-start border-b-2 border-primary/20 pb-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Activity className="w-6 h-6" />
                        MedInsight Platform
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-sans">E-Health Service Portabilty</p>
                </div>
                <div className="text-right text-xs text-slate-400 font-sans">
                    <p>Document Officiel</p>
                    <p>Ref: ORDX-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                </div>
            </div>

            {/* Patient & Doctor Info */}
            <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">Patient</p>
                    <p className="font-bold text-lg">{prescription.patientName || "John Doe"}</p>
                    <p className="text-sm text-slate-500 font-sans">Dossier: #004523</p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">Médecin Prescripteur</p>
                    <p className="font-bold text-lg">Dr. {prescription.doctorName || "Mansour"}</p>
                    <p className="text-sm text-slate-500 font-sans">Date: {prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
                </div>
            </div>

            {/* Prescription Body */}
            <div className="mb-12 min-h-[300px]">
                <h3 className="text-3xl font-light italic text-slate-400 mb-8 flex items-center gap-4">
                    Ordonnance <div className="h-px flex-1 bg-slate-100"></div>
                </h3>

                <div className="space-y-8">
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-primary font-bold shrink-0">
                            Rx
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-bold text-slate-900 uppercase underline decoration-primary/30 underline-offset-4">
                                {prescription.medicationName}
                            </p>
                            <p className="text-lg text-slate-700 italic">
                                {prescription.dosage}
                            </p>
                            <p className="text-sm text-slate-500 border-l-2 border-slate-100 pl-4 py-1">
                                <span className="font-bold">Durée :</span> {prescription.duration}
                            </p>
                            {prescription.instructions && (
                                <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded italic">
                                    Note: {prescription.instructions}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Validity */}
            <div className="border-t-2 border-slate-50 pt-8 mt-12 flex justify-between items-end">
                <div className="text-[10px] text-slate-400 max-w-[200px] font-sans">
                    Cette ordonnance est valable pour une durée de 3 mois à compter de sa date d'émission.
                    Validité territoriale : Tunisie.
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 font-sans">Cachet Electronique</p>
                    <div className="w-32 h-16 border-2 border-primary/20 rounded flex items-center justify-center opacity-50">
                        <p className="text-[10px] text-primary font-bold font-sans uppercase rotate-12">MedInsight Certified</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
