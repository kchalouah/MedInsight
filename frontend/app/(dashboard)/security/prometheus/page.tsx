"use client"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Activity } from "lucide-react"

export default function PrometheusPage() {
    return (
        <DashboardLayout role="security">
            <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Infrastructure de Métriques</h1>
                <p className="text-slate-600 max-w-md mb-8">
                    Prometheus collecte les métriques de performance de tous vos services. Pour des raisons de sécurité, accédez directement au portail de visualisation.
                </p>
                <a
                    href="http://localhost:9090"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    Ouvrir Prometheus dans un nouvel onglet
                </a>
            </div>
        </DashboardLayout>
    )
}
