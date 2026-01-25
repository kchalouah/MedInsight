"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home, Calendar, FileText, Pill, Users, BarChart3,
    Stethoscope, ClipboardList, Search, Settings, Shield, Activity
} from "lucide-react"

interface SidebarProps {
    role: "patient" | "medecin" | "admin" | "security" | "gestionnaire"
}

const navigationConfig = {
    patient: [
        { name: "Tableau de bord", href: "/patient/dashboard", icon: Home },
        { name: "Mes Rendez-vous", href: "/patient/appointments", icon: Calendar },
        { name: "Mon Dossier Médical", href: "/patient/dossier", icon: FileText },
        { name: "Mes Ordonnances", href: "/patient/prescriptions", icon: Pill },
    ],
    medecin: [
        { name: "Tableau de bord", href: "/medecin/dashboard", icon: Home },
        { name: "Mes Patients", href: "/medecin/patients", icon: Users },
        { name: "Historique RDV", href: "/medecin/appointments", icon: Calendar },
        { name: "Assistant IA", href: "/medecin/assistant", icon: Stethoscope },
    ],
    admin: [
        { name: "Tableau de bord", href: "/admin/dashboard", icon: Home },
        { name: "Gestion des Utilisateurs", href: "/admin/users", icon: Users },
        { name: "Rapports d'Activité", href: "/admin/reports", icon: BarChart3 },
        { name: "Journaux d'Audit", href: "/admin/audit", icon: ClipboardList },
        { name: "Configuration Système", href: "/admin/settings", icon: Settings },
    ],
    gestionnaire: [
        { name: "Tableau de bord", href: "/gestionnaire/dashboard", icon: Home },
        { name: "Gestion Patients", href: "/gestionnaire/patients", icon: Users },
        { name: "Gestion Médecins", href: "/gestionnaire/medecins", icon: Stethoscope },
        { name: "Rapports d'Activité", href: "/admin/reports", icon: BarChart3 },
        { name: "Configuration Système", href: "/admin/settings", icon: Settings },
    ],
    security: [
        { name: "Tableau de bord", href: "/security/dashboard", icon: Home },
        { name: "Logs d'Audit", href: "/security/audit", icon: ClipboardList },
        { name: "Monitoring (Grafana)", href: "/security/grafana", icon: BarChart3 },
        { name: "Logs (Loki)", href: "/security/loki", icon: FileText },
        { name: "Métriques (Prometheus)", href: "/security/prometheus", icon: Activity },
        { name: "Keycloak Console", href: "http://localhost:8180/admin/master/console/", icon: Shield },
    ],
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()
    const navItems = navigationConfig[role]

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 overflow-y-auto">
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                                    ${isActive
                                        ? 'bg-gradient-to-r from-primary/10 to-teal-500/10 text-primary border-l-4 border-primary'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
                <div className="flex justify-around items-center h-16">
                    {navItems.slice(0, 4).map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors
                                    ${isActive ? 'text-primary' : 'text-slate-500'}
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
