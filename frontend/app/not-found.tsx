"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 overflow-hidden relative">
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-3xl font-bold" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center space-y-8"
            >
                <div className="relative inline-block">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="text-9xl font-black text-slate-100 selection:bg-transparent"
                    >
                        404
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-slate-100">
                            <Search className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-slate-900 mt-4">Page Introuvable</h1>
                    <p className="text-slate-500">
                        Oups ! La page que vous recherchez semble avoir disparu ou l'adresse est incorrecte.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href="/" className="flex-1">
                        <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-primary/20">
                            <Home className="w-5 h-5" /> Retour à l'accueil
                        </button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" /> Page précédente
                    </button>
                </div>

                <p className="text-xs text-slate-400 mt-8">
                    Si vous pensez qu'il s'agit d'une erreur, contactez le support MedInsight.
                </p>
            </motion.div>
        </div>
    )
}
