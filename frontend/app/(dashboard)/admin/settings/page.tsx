"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import {
    Settings, Activity, Globe, Shield,
    Database, Cpu, HardDrive, Zap, Info
} from "lucide-react"
import { motion } from "framer-motion"

export default function AdminSettingsPage() {
    const [systemStatus, setSystemStatus] = useState({
        gateway: "ONLINE",
        authService: "ONLINE",
        patientService: "ONLINE",
        medecinService: "ONLINE",
        appointmentService: "ONLINE",
        recordService: "ONLINE",
        auditService: "ONLINE",
        mlService: "ONLINE",
        database: "CONNECTED",
        keycloak: "CONNECTED"
    })

    const [loading, setLoading] = useState(false)

    interface SystemItem {
        name: string;
        status: string;
        latency?: string;
        info?: string;
    }

    const sections: { title: string; icon: any; items: SystemItem[] }[] = [
        {
            title: "État des Services",
            icon: Cpu,
            items: [
                { name: "Passerelle API (Gateway)", status: systemStatus.gateway, latency: "45ms" },
                { name: "Service Authentification", status: systemStatus.authService, latency: "12ms" },
                { name: "Service Patients", status: systemStatus.patientService, latency: "18ms" },
                { name: "Service Médecins", status: systemStatus.medecinService, latency: "22ms" },
                { name: "Service Rendez-vous", status: systemStatus.appointmentService, latency: "15ms" },
                { name: "Service Dossiers Médicaux", status: systemStatus.recordService, latency: "30ms" },
                { name: "Service Audit", status: systemStatus.auditService, latency: "10ms" },
                { name: "Service ML (Intelligence Artificielle)", status: systemStatus.mlService, latency: "150ms" },
            ]
        },
        {
            title: "Infrastructure & Stockage",
            icon: Database,
            items: [
                { name: "Base de données PostgreSQL", status: systemStatus.database, info: "5432 (Local)" },
                { name: "Fournisseur d'Identité (Keycloak)", status: systemStatus.keycloak, info: "Realm: medinsight" },
                { name: "Serveur de Découverte (Eureka)", status: "ONLINE", info: "Instance: primary" }
            ]
        }
    ]

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings className="w-7 h-7 text-primary" />
                        Paramètres & Santé du Système
                    </h1>
                    <p className="text-slate-500">Configuration globale et monitoring de l'infrastructure</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                                <section.icon className="w-6 h-6 text-primary" />
                                <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
                            </div>
                            <div className="p-0">
                                {section.items.map((item, i) => (
                                    <div
                                        key={item.name}
                                        className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${i !== section.items.length - 1 ? 'border-b border-slate-50' : ''}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">{item.name}</span>
                                            {item.latency && <span className="text-xs text-slate-400">Latence: {item.latency}</span>}
                                            {item.info && <span className="text-xs text-slate-400">{item.info}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'ONLINE' || item.status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.status}
                                            </span>
                                            <Zap className={`w-4 h-4 ${item.status === 'ONLINE' || item.status === 'CONNECTED' ? 'text-yellow-500' : 'text-slate-300'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}

                    {/* Platform Config Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-primary/10 to-teal-500/10 rounded-2xl p-8 border border-primary/20 flex flex-col items-center text-center justify-center space-y-4"
                    >
                        <Globe className="w-12 h-12 text-primary" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Configuration Globale</h3>
                            <p className="text-slate-600 mt-2 max-w-sm">
                                Les paramètres de notification email, les clés API de services tiers et les quotas de stockage sont gérés de manière centralisée.
                            </p>
                        </div>
                        <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-all shadow-md">
                            Éditer la Configuration
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col items-center text-center justify-center space-y-4"
                    >
                        <Shield className="w-12 h-12 text-orange-500" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Sécurité & Accès</h3>
                            <p className="text-slate-600 mt-2 max-w-sm">
                                Dernière vérification d'intégrité du système: <span className="font-semibold">Il y a 12 minutes</span>.
                                Aucune anomalie détectée.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                <Activity className="w-4 h-4" />
                                SSL Actif
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium ml-4">
                                <Shield className="w-4 h-4" />
                                Pare-feu Actif
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    )
}
