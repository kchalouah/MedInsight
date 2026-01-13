"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldAlert, Home, LogIn } from "lucide-react"

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 overflow-hidden relative">
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-red-500/5 blur-3xl opacity-50" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full bg-white p-12 rounded-[2rem] border border-slate-100 shadow-2xl text-center space-y-8"
            >
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-slate-900">Accès Refusé</h1>
                    <p className="text-slate-500 leading-relaxed">
                        Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.
                        Cette tentative a été enregistrée dans nos journaux d'audit de sécurité.
                    </p>
                </div>

                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50">
                    <p className="text-xs text-red-700 font-mono">
                        Erreur 403: Security Violation - Insufficient Permissions
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href="/" className="flex-1">
                        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                            <Home className="w-5 h-5" /> Accueil
                        </button>
                    </Link>
                    <Link href="/login" className="flex-1">
                        <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                            <LogIn className="w-5 h-5" /> Changer de compte
                        </button>
                    </Link>
                </div>

                <p className="text-xs text-slate-400">
                    ID de session: {Math.random().toString(36).substring(7).toUpperCase()}
                </p>
            </motion.div>
        </div>
    )
}
