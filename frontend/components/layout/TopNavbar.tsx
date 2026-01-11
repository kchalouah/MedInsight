"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bell, ChevronDown, User, Settings, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"

export default function TopNavbar() {
    const { user, logout } = useAuth()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [notificationCount] = useState(3) // Placeholder for notifications

    const handleLogout = () => {
        logout()
    }

    if (!user) return null

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
                {/* Left: Logo + Platform Name */}
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 relative">
                        <Image
                            src="/logo.png"
                            alt="MedInsight Logo"
                            fill
                            className="object-contain group-hover:scale-110 transition-transform"
                        />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-teal-600">
                        MedInsight
                    </span>
                </Link>

                {/* Right: Notifications + Language + User Menu */}
                <div className="flex items-center gap-4">
                    {/* Notifications Bell */}
                    <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <Bell className="w-5 h-5 text-slate-600" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {notificationCount}
                            </span>
                        )}
                    </button>

                    {/* Language Selector (Placeholder) */}
                    <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors">
                        FR
                    </button>

                    {/* User Avatar + Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-slate-700">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                                >
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <User className="w-4 h-4 text-slate-600" />
                                        <span className="text-sm font-medium text-slate-700">Mon Profil</span>
                                    </Link>

                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Settings className="w-4 h-4 text-slate-600" />
                                        <span className="text-sm font-medium text-slate-700">Paramètres</span>
                                    </button>

                                    <div className="my-1 border-t border-slate-100" />

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-medium text-red-600">Déconnexion</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    )
}
