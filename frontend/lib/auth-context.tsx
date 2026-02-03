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
        if (typeof window === "undefined") return;

        // 1. Handle OAuth Callback if present in URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")

        if (code) {
            handleOAuthCallback(code)
        } else {
            // 2. Check for existing session on mount
            checkAuth()
        }
    }, [])

    const handleOAuthCallback = async (code: string) => {
        setLoading(true)
        try {
            const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || ""
            const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "medinsight"
            const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "medinsight-frontend"
            const redirectUri = typeof window !== "undefined" ? window.location.origin : ""

            const params = new URLSearchParams()
            params.append("client_id", clientId)
            params.append("grant_type", "authorization_code")
            params.append("code", code)
            params.append("redirect_uri", redirectUri)

            const response = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params
            })

            const data = await response.json()
            if (response.ok && data.access_token) {
                // Clear the code from URL without refreshing
                const newUrl = window.location.pathname
                window.history.replaceState({}, "", newUrl)

                login(data.access_token)
            } else {
                console.error("OAuth Exchange failed:", data)
                router.push("/login")
            }
        } catch (error) {
            console.error("OAuth Callback Error:", error)
            router.push("/login")
        } finally {
            setLoading(false)
        }
    }

    const checkAuth = () => {
        const token = localStorage.getItem("token")
        if (token) {
            try {
                // Decode JWT token (simple base64 decode for demo)
                const payload = JSON.parse(atob(token.split('.')[1]))
                const roles: string[] = payload.realm_access?.roles || []
                const normalizedRoles = roles.map(r => r.toUpperCase().replace('ROLE_', ''))

                const roleKey = normalizedRoles.find(r =>
                    ['ADMIN', 'MEDECIN', 'GESTIONNAIRE', 'RESPONSABLE_SECURITE'].includes(r)
                ) || normalizedRoles[0] || 'PATIENT'

                const userData: User = {
                    id: payload.sub,
                    keycloakId: payload.sub,
                    email: payload.email || payload.preferred_username,
                    name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
                    firstName: payload.given_name || '',
                    lastName: payload.family_name || '',
                    role: `ROLE_${roleKey}`
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

        // Decode and find redirect role immediately
        const payload = JSON.parse(atob(token.split('.')[1]))
        const roles: string[] = payload.realm_access?.roles || []
        const normalizedRoles = roles.map(r => r.toUpperCase().replace('ROLE_', ''))

        const roleKey = normalizedRoles.find(r =>
            ['ADMIN', 'MEDECIN', 'GESTIONNAIRE', 'RESPONSABLE_SECURITE'].includes(r)
        ) || normalizedRoles[0] || 'PATIENT'

        const role = `ROLE_${roleKey}`

        const dashboardMap: Record<string, string> = {
            'ROLE_PATIENT': '/patient/dashboard',
            'ROLE_MEDECIN': '/medecin/dashboard',
            'ROLE_GESTIONNAIRE': '/gestionnaire/dashboard',
            'ROLE_RESPONSABLE_SECURITE': '/security/dashboard',
            'ROLE_ADMIN': '/admin/dashboard'
        }

        const redirectPath = dashboardMap[role] || '/patient/dashboard'

        // Update user state and redirect
        checkAuth()
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
