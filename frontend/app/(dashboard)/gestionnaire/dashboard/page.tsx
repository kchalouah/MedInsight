"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/ui/StatsCard"
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from "@/lib/auth-context"

export default function GestionnaireDashboard() {
    const { user } = useAuth()

    const activityData = [
        { name: 'Lun', value: 45 },
        { name: 'Mar', value: 52 },
        { name: 'Mer', value: 48 },
        { name: 'Jeu', value: 61 },
        { name: 'Ven', value: 55 },
        { name: 'Sam', value: 24 },
        { name: 'Dim', value: 12 },
    ];

    const distributionData = [
        { name: 'Cardiologie', value: 400 },
        { name: 'Pédiatrie', value: 300 },
        { name: 'Général', value: 300 },
        { name: 'Dentaire', value: 200 },
    ];

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

    return (
        <DashboardLayout role="gestionnaire">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Bonjour, {user?.firstName || 'Gestionnaire'} 👋
                    </h1>
                    <p className="text-slate-500">Aperçu de l'activité de la clinique.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Link href="/gestionnaire/patients">
                        <div className="cursor-pointer hover:scale-105 transition-transform h-full">
                            <StatsCard
                                title="Gestion Patients"
                                value="Liste"
                                icon={Users}
                                variant="primary"
                            />
                        </div>
                    </Link>
                    <StatsCard
                        title="Rendez-vous Total"
                        value="1,284"
                        icon={Calendar}
                        variant="success"
                    />
                    <StatsCard
                        title="Taux d'Occupation"
                        value="87%"
                        icon={TrendingUp}
                        variant="warning"
                    />
                    <StatsCard
                        title="Revenus (Est.)"
                        value="45k €"
                        icon={DollarSign}
                        variant="default"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 font-display">Activité Hebdomadaire</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 font-display">Répartition par Service</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
