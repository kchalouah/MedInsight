"use client"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { FileText } from "lucide-react"

export default function LokiPage() {
    return (
        <DashboardLayout role="security">
            <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Infrastructure de Logs</h1>
                <p className="text-slate-600 max-w-md mb-8">
                    Loki centralise les logs de tous les microservices. Accédez au tableau de bord Grafana pour filtrer et analyser les journaux système.
                </p>
                <a
                    href="http://localhost:3000/explore?orgId=1&left=%7B%22datasource%22:%22Loki%22,%22queries%22:%5B%7B%22refId%22:%22A%22%7D%5D%7D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    Ouvrir Grafana (Loki) dans un nouvel onglet
                </a>
            </div>
        </DashboardLayout>
    )
}
