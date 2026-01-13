"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { adminApi, UserResponse } from "@/lib/api"
import {
    Search, Filter, MoreVertical, Shield,
    UserPlus, Mail, Phone, Calendar, CheckCircle, XCircle, ArrowLeft, ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("ALL")
    const PAGE_SIZE = 10

    // Create User Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newData, setNewData] = useState<any>({
        firstName: '', lastName: '', email: '', password: '', role: 'PATIENT'
    })

    // Edit/Delete State
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [currentPage])

    async function fetchUsers() {
        setLoading(true)
        try {
            const data = await adminApi.getUsers(currentPage, PAGE_SIZE)
            setUsers(data.content)
            setTotalPages(data.totalPages)
            setTotalElements(data.totalElements)
        } catch (err: any) {
            console.error(err)
            setError("Impossible de charger les utilisateurs.")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault()
        try {
            await adminApi.createUser(newData)
            setIsCreateModalOpen(false)
            setNewData({ firstName: '', lastName: '', email: '', password: '', role: 'PATIENT' })
            fetchUsers() // Refresh list
            alert("Utilisateur créé avec succès !")
        } catch (err: any) {
            console.error(err)
            alert("Erreur lors de la création : " + (err.response?.data?.message || err.message))
        }
    }

    async function handleDeleteUser(keycloakId: string) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return

        setIsDeleting(keycloakId)
        try {
            await adminApi.deleteUser(keycloakId)
            fetchUsers()
            alert("Utilisateur supprimé avec succès.")
        } catch (err: any) {
            console.error(err)
            alert("Erreur lors de la suppression.")
        } finally {
            setIsDeleting(null)
        }
    }

    async function handleRoleUpdate(keycloakId: string, newRole: string) {
        setIsUpdatingRole(keycloakId)
        try {
            await adminApi.assignRole(keycloakId, newRole)
            fetchUsers()
            alert("Rôle mis à jour avec succès.")
        } catch (err: any) {
            console.error(err)
            alert("Erreur lors de la mise à jour du rôle.")
        } finally {
            setIsUpdatingRole(null)
        }
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.lastName.toLowerCase().includes(searchTerm.toLowerCase())

        // Note: Role filtering is client-side for now as the backend 
        // /admin/users endpoint returns all users. 
        // ideally backend should support ?role=...
        const userRole = u.role || 'PATIENT' // Fallback
        const matchesRole = roleFilter === "ALL" || userRole === roleFilter

        return matchesSearch && matchesRole
    })

    const getRoleBadge = (role: string) => {
        const config: Record<string, string> = {
            'ROLE_PATIENT': 'bg-green-100 text-green-700',
            'ROLE_MEDECIN': 'bg-teal-100 text-teal-700',
            'ROLE_GESTIONNAIRE': 'bg-orange-100 text-orange-700',
            'ROLE_ADMIN': 'bg-purple-100 text-purple-700',
            'ROLE_RESPONSABLE_SECURITE': 'bg-red-100 text-red-700'
        }
        // Handle "PATIENT" vs "ROLE_PATIENT" just in case
        const normalized = role.startsWith('ROLE_') ? role : `ROLE_${role}`
        return config[normalized] || 'bg-slate-100 text-slate-700'
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
                    <p className="text-slate-500">
                        Total: {totalElements} utilisateurs enregistrés
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 bg-primary hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Nouvel utilisateur</span>
                </button>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Créer un nouvel utilisateur</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={newData.firstName}
                                        onChange={e => setNewData({ ...newData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={newData.lastName}
                                        onChange={e => setNewData({ ...newData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={newData.email}
                                    onChange={e => setNewData({ ...newData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={newData.password}
                                    onChange={e => setNewData({ ...newData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={newData.role}
                                    onChange={e => setNewData({ ...newData, role: e.target.value })}
                                >
                                    <option value="PATIENT">Patient (PATIENT)</option>
                                    <option value="MEDECIN">Médecin (MEDECIN)</option>
                                    <option value="GESTIONNAIRE">Admin (GESTIONNAIRE)</option>
                                    <option value="RESPONSABLE_SECURITE">Sécurité (RESPONSABLE_SECURITE)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-700 shadow-md"
                                >
                                    Créer l'utilisateur
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-slate-400 w-5 h-5" />
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="ALL">Tous les rôles</option>
                        <option value="ROLE_PATIENT">Patients</option>
                        <option value="ROLE_MEDECIN">Médecins</option>
                        <option value="ROLE_GESTIONNAIRE">Gestionnaires</option>
                        <option value="ROLE_ADMIN">Admins</option>
                        <option value="ROLE_RESPONSABLE_SECURITE">Sécurité</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-4 px-6 font-semibold text-slate-600">Utilisateur</th>
                                <th className="text-left py-4 px-6 font-semibold text-slate-600">Rôle</th>
                                <th className="text-left py-4 px-6 font-semibold text-slate-600">Contact</th>
                                <th className="text-left py-4 px-6 font-semibold text-slate-600">Statut</th>
                                <th className="text-right py-4 px-6 font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-500">
                                        Chargement des données...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-500">
                                        Aucun utilisateur trouvé.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <select
                                                className={`px-2 py-1 rounded-md text-xs font-medium border-none outline-none cursor-pointer ${getRoleBadge(user.role || 'ROLE_PATIENT')}`}
                                                value={user.role?.startsWith('ROLE_') ? user.role : `ROLE_${user.role}`}
                                                disabled={isUpdatingRole === user.keycloakId}
                                                onChange={(e) => handleRoleUpdate(user.keycloakId, e.target.value.replace('ROLE_', ''))}
                                            >
                                                <option value="ROLE_PATIENT">Patient</option>
                                                <option value="ROLE_MEDECIN">Médecin</option>
                                                <option value="ROLE_GESTIONNAIRE">Gestionnaire</option>
                                                <option value="ROLE_RESPONSABLE_SECURITE">Sécurité</option>
                                                <option value="ROLE_ADMIN">Admin</option>
                                            </select>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                {user.phoneNumber && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Phone className="w-3 h-3" />
                                                        {user.phoneNumber}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {user.enabled ? (
                                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                                                    <XCircle className="w-4 h-4" />
                                                    Désactivé
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDeleteUser(user.keycloakId)}
                                                    disabled={isDeleting === user.keycloakId}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    title="Supprimer l'utilisateur"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Page {currentPage + 1} sur {totalPages > 0 ? totalPages : 1}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0 || loading}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1 || loading}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
