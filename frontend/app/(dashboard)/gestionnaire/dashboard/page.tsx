"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react"

export default function GestionnaireDashboard() {
    return (
        <DashboardLayout role="gestionnaire">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Tableau de Bord Gestion</h1>
                    <p className="text-slate-500">Aperçu de l'activité de la clinique.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatsCard
                        title="Rendez-vous Total"
                        value="1,284"
                        icon={Calendar}
                        variant="primary"
                    />
                    <StatsCard
                        title="Nouveaux Patients"
                        value="+45"
                        icon={Users}
                        variant="success"
                    />
                    <StatsCard
                        title="Taux d'Occupation"
                        value="87%"
                        icon={TrendingUp}
                        variant="warning"
                    />
                    <StatsCard
                        title="Revenus (Est.)"
                        value="45k €"
                        icon={DollarSign}
                        variant="default"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-64 flex items-center justify-center text-slate-400 italic">
                        Graphique d'activité mensuelle (Placeholder)
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-64 flex items-center justify-center text-slate-400 italic">
                        Répartition par service (Placeholder)
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
