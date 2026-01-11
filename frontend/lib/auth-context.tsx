"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    role: string
    keycloakId: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (token: string) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check for existing session on mount
        checkAuth()
    }, [])

    const checkAuth = () => {
        const token = localStorage.getItem("token")
        if (token) {
            try {
                // Decode JWT token (simple base64 decode for demo)
                const payload = JSON.parse(atob(token.split('.')[1]))
                const userData: User = {
                    id: payload.sub,
                    keycloakId: payload.sub,
                    email: payload.email || payload.preferred_username,
                    name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
                    firstName: payload.given_name || '',
                    lastName: payload.family_name || '',
                    role: payload.realm_access?.roles?.find((r: string) =>
                        r.startsWith('ROLE_')
                    ) || 'ROLE_PATIENT'
                }
                setUser(userData)
            } catch (error) {
                console.error("Failed to parse token:", error)
                localStorage.removeItem("token")
            }
        }
        setLoading(false)
    }

    const login = (token: string) => {
        localStorage.setItem("token", token)
        checkAuth()

        // Redirect based on role
        const payload = JSON.parse(atob(token.split('.')[1]))
        const role = payload.realm_access?.roles?.find((r: string) => r.startsWith('ROLE_'))

        const dashboardMap: Record<string, string> = {
            'ROLE_PATIENT': '/patient/dashboard',
            'ROLE_MEDECIN': '/medecin/dashboard',
            'ROLE_GESTIONNAIRE': '/admin/dashboard',
            'ROLE_RESPONSABLE_SECURITE': '/security/dashboard',
            'ROLE_ADMIN': '/admin/dashboard'
        }

        const redirectPath = dashboardMap[role] || '/patient/dashboard'
        router.push(redirectPath)
    }

    const logout = () => {
        localStorage.removeItem("token")
        sessionStorage.clear()
        setUser(null)
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
