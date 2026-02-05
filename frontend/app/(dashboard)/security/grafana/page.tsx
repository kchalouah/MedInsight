"use client"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { BarChart3, ExternalLink } from "lucide-react"

export default function SecurityGrafanaPage() {
    return (
        <DashboardLayout role="security">
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white/50 backdrop-blur-md border border-slate-200 rounded-3xl p-12 text-center space-y-6 shadow-xl">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-orange-600" />
                </div>
                <div className="max-w-md">
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Grafana</h1>
                    <p className="text-slate-600 mt-2">
                        Accédez aux métriques détaillées et aux visualisations avancées de l'infrastructure via l'instance Grafana sécurisée.
                    </p>
                </div>
                <div className="pt-4">
                    <a
                        href="http://localhost:3000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center gap-2"
                    >
                        Ouvrir Grafana
                        <ExternalLink className="w-5 h-5" />
                    </a>
                </div>
                <p className="text-xs text-slate-400">
                    Note: Les identifiants par défaut sont admin / admin si non modifiés.
                </p>
            </div>
        </DashboardLayout>
    )
}
