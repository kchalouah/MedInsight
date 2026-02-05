"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import { Activity, Shield, Server, FileText, Globe, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

export default function SecurityDashboard() {
    return (
        <DashboardLayout role="security">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Sécurité & Monitoring</h1>
                    <p className="text-slate-500">Vue d'ensemble de l'infrastructure et de la sécurité.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Systèmes Actifs"
                        value="8/8"
                        icon={Server}
                        variant="success"
                    />
                    <StatsCard
                        title="Alertes Critiques"
                        value="0"
                        icon={AlertTriangle}
                        variant="primary"
                    />
                    <StatsCard
                        title="Tentatives Intrusion"
                        value="2"
                        icon={Shield}
                        variant="warning"
                    />
                </div>

                {/* Monitoring Tools Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a
                        href="http://localhost:3000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-6 bg-white rounded-2xl border border-slate-200 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Grafana</h3>
                                <p className="text-sm text-slate-500">Tableaux de bord visuels</p>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm">Accéder aux dashboards de performance système, latence et erreurs.</p>
                    </a>

                    <a
                        href="http://localhost:9090"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-6 bg-white rounded-2xl border border-slate-200 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Prometheus</h3>
                                <p className="text-sm text-slate-500">Métriques brutes</p>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm">Exploration directe des métriques et configuration des alertes.</p>
                    </a>

                    <a
                        href="http://localhost:3100"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Loki</h3>
                                <p className="text-sm text-slate-500">Agrégation de logs</p>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm">Recherche et analyse centralisée des journaux applicatifs.</p>
                    </a>

                    <div className="block p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <div className="flex items-center gap-4 mb-4 opacity-50">
                            <div className="p-3 bg-slate-200 text-slate-500 rounded-2xl">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Zipkin / Jaeger</h3>
                                <p className="text-sm text-slate-500">Tracing distribué</p>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm italic">Service de tracing non détecté ou non configuré.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
