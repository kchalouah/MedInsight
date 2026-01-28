"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ScheduleManager from "@/components/medecin/ScheduleManager";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Clock, Info } from "lucide-react";

export default function DoctorSchedulePage() {
    const { user } = useAuth();

    return (
        <DashboardLayout role="medecin">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <Clock className="w-8 h-8 text-primary" />
                            Gérer Mon Emploi du Temps
                        </h1>
                        <p className="text-slate-500 mt-1">Configurez vos heures de consultation et vos périodes d'absence.</p>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-bold">Comment ça marche ?</p>
                        <p className="mt-1 opacity-90">
                            Votre emploi du temps hebdomadaire définit les créneaux par défaut qui seront proposés aux patients.
                            Les "Périodes d'Absence" bloqueront automatiquement ces créneaux, même s'ils font partie de vos heures normales de travail.
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                {user?.id ? (
                    <ScheduleManager doctorId={user.id} />
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Authentification requise</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            Veuillez vous reconnecter pour accéder à la gestion de votre emploi du temps.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
