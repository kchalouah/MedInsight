"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"

export default function PatientDossierPage() {
    return (
        <DashboardLayout role="patient">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Mon Dossier Médical</h1>
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-slate-600">Page en construction - Dossier médical complet</p>
            </div>
        </DashboardLayout>
    )
}
