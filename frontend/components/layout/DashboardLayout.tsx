"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import TopNavbar from "./TopNavbar"
import Sidebar from "./Sidebar"
import { useAuth } from "@/lib/auth-context"

interface DashboardLayoutProps {
    children: ReactNode
    role: "patient" | "medecin" | "admin" | "security"
}

// Map Keycloak roles to frontend role types
function mapKeycloakRoleToFrontendRole(keycloakRole: string): "patient" | "medecin" | "admin" | "security" {
    const roleMap: Record<string, "patient" | "medecin" | "admin" | "security"> = {
        'ROLE_PATIENT': 'patient',
        'ROLE_MEDECIN': 'medecin',
        'ROLE_ADMIN': 'admin',
        'ROLE_GESTIONNAIRE': 'admin', // Legacy support
        'ROLE_RESPONSABLE_SECURITE': 'security',
    }
    return roleMap[keycloakRole] || 'patient'
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    // Derive actual role from user's Keycloak role
    const actualRole = user ? mapKeycloakRoleToFrontendRole(user.role) : role

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Chargement...</p>
                </div>
            </div>
        )
    }

    if (!user) return null
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <TopNavbar />

            <div className="flex">
                {/* Sidebar - use actual user role */}
                <Sidebar role={actualRole} />

                {/* Main Content Area */}
                <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
