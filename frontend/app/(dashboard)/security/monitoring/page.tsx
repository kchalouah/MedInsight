"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { Activity, Server, Database, Zap, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

export default function SecurityMonitoringPage() {
    const services = [
        { name: "Auth Service", status: "healthy", uptime: "99.9%", requests: "1,247", latency: "45ms" },
        { name: "Appointment Service", status: "healthy", uptime: "99.8%", requests: "892", latency: "52ms" },
        { name: "Medical Record Service", status: "healthy", uptime: "99.7%", requests: "654", latency: "38ms" },
        { name: "Audit Service", status: "healthy", uptime: "100%", requests: "2,145", latency: "25ms" },
        { name: "Mail Service", status: "healthy", uptime: "99.5%", requests: "325", latency: "102ms" },
        { name: "ML Service", status: "degraded", uptime: "98.2%", requests: "124", latency: "235ms" },
    ]

    const getStatusBadge = (status: string) => {
        if (status === "healthy") {
            return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ Sain</span>
        }
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">⚠ Dégradé</span>
    }

    return (
        <DashboardLayout role="security">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Monitoring Système</h1>
                        <p className="text-slate-600 mt-1">Surveillance en temps réel des services</p>
                    </div>
                    <a
                        href="http://localhost:8180/admin/master/console/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <Server className="w-4 h-4" />
                        Administration Keycloak
                    </a>
                </div>

                {/* System Health Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-green-500/5 to-green-600/5 backdrop-blur-md border border-green-200 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Services Actifs</p>
                            <Server className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">6/6</p>
                        <p className="text-xs text-green-600 font-medium mt-2">✓ Tous opérationnels</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 backdrop-blur-md border border-blue-200 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Uptime Moyen</p>
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">99.5%</p>
                        <p className="text-xs text-green-600 font-medium mt-2">↑ +0.2% ce mois</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 backdrop-blur-md border border-purple-200 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Requêtes/h</p>
                            <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">5,387</p>
                        <p className="text-xs text-slate-500 font-medium mt-2">Charge normale</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 backdrop-blur-md border border-orange-200 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Alertes Actives</p>
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">1</p>
                        <p className="text-xs text-orange-600 font-medium mt-2">ML Service lent</p>
                    </motion.div>
                </div>

                {/* Services Status */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">État des Services</h3>
                    <div className="space-y-4">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Database className="w-5 h-5 text-slate-600" />
                                        <h4 className="font-semibold text-slate-900">{service.name}</h4>
                                    </div>
                                    {getStatusBadge(service.status)}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500">Uptime</p>
                                        <p className="font-semibold text-slate-900">{service.uptime}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Requêtes (24h)</p>
                                        <p className="font-semibold text-slate-900">{service.requests}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Latence Moy.</p>
                                        <p className={`font-semibold ${parseInt(service.latency) > 150 ? 'text-orange-600' : 'text-green-600'
                                            }`}>{service.latency}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Database Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">État des Bases de Données</h3>
                        <div className="space-y-3">
                            {[
                                { name: "PostgreSQL (Auth)", status: "Connected", size: "2.4 GB", connections: "12/100" },
                                { name: "PostgreSQL (Records)", status: "Connected", size: "5.8 GB", connections: "23/100" },
                            ].map((db, index) => (
                                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-slate-900">{db.name}</p>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                            {db.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-600">
                                        <span>Taille: {db.size}</span>
                                        {db.connections && <span>Connexions: {db.connections}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Alertes Récentes</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-orange-900">ML Service - Latence élevée</p>
                                        <p className="text-xs text-orange-700 mt-1">Latence moyenne: 235ms (seuil: 150ms)</p>
                                        <p className="text-xs text-orange-600 mt-1">Il y a 15 minutes</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Activity className="w-4 h-4 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-900">Tous les services opérationnels</p>
                                        <p className="text-xs text-green-700 mt-1">Uptime: 99.5% ce mois</p>
                                        <p className="text-xs text-green-600 mt-1">Il y a 1 heure</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
