"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { adminApi, UserResponse } from "@/lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import {
    Search, UserPlus, Filter, MoreVertical, Trash2, Shield, Mail, Calendar, XCircle, RefreshCw,
    Phone, CheckCircle, ArrowLeft, ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "react-hot-toast"

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
        firstName: '', lastName: '', email: '', password: '', role: 'PATIENT',
        phoneNumber: '', addressLine: '', city: '', country: 'Tunisie',
        // Patient fields
        dateOfBirth: '', gender: 'MALE', bloodType: '',
        emergencyContactName: '', emergencyContactPhone: '',
        insuranceProvider: '', insuranceNumber: '',
        // Medecin fields
        specialization: '', licenseNumber: '', yearsOfExperience: 0, consultationFee: 50
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
            toast.error("Erreur de chargement des utilisateurs")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault()
        try {
            // Format data for backend
            const payload = { ...newData }
            if (payload.role !== 'PATIENT') {
                delete payload.dateOfBirth
                delete payload.gender
                delete payload.bloodType
                delete payload.emergencyContactName
                delete payload.emergencyContactPhone
                delete payload.insuranceProvider
                delete payload.insuranceNumber
            }
            if (payload.role !== 'MEDECIN') {
                delete payload.specialization
                delete payload.licenseNumber
                delete payload.yearsOfExperience
                delete payload.consultationFee
            }

            await adminApi.createUser(payload)
            setIsCreateModalOpen(false)
            setNewData({
                firstName: '', lastName: '', email: '', password: '', role: 'PATIENT',
                phoneNumber: '', addressLine: '', city: '', country: 'Tunisie',
                dateOfBirth: '', gender: 'MALE', bloodType: '',
                emergencyContactName: '', emergencyContactPhone: '',
                insuranceProvider: '', insuranceNumber: '',
                specialization: '', licenseNumber: '', yearsOfExperience: 0, consultationFee: 50
            })
            fetchUsers() // Refresh list
            toast.success("Utilisateur créé avec succès !")
        } catch (err: any) {
            console.error(err)
            toast.error("Erreur lors de la création : " + (err.response?.data?.message || err.message))
        }
    }

    async function handleDeleteUser(keycloakId: string) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return

        setIsDeleting(keycloakId)
        try {
            await adminApi.deleteUser(keycloakId)
            fetchUsers()
            toast.success("Utilisateur supprimé avec succès.")
        } catch (err: any) {
            console.error(err)
            toast.error("Erreur lors de la suppression.")
        } finally {
            setIsDeleting(null)
        }
    }

    async function handleRoleUpdate(keycloakId: string, newRole: string) {
        setIsUpdatingRole(keycloakId)
        try {
            await adminApi.assignRole(keycloakId, newRole)
            fetchUsers()
            toast.success("Rôle mis à jour avec succès.")
        } catch (err: any) {
            console.error(err)
            toast.error("Erreur lors de la mise à jour du rôle.")
        } finally {
            setIsUpdatingRole(null)
        }
    }

    async function handleSyncKeycloak() {
        setLoading(true)
        try {
            await adminApi.syncKeycloak()
            fetchUsers()
            toast.success("Synchronisation avec Keycloak réussie !")
        } catch (err: any) {
            console.error(err)
            toast.error("Erreur lors de la synchronisation.")
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.lastName.toLowerCase().includes(searchTerm.toLowerCase())

        const userRole = u.role || 'ROLE_PATIENT'
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
        const normalized = role?.startsWith('ROLE_') ? role : `ROLE_${role}`
        return config[normalized] || 'bg-slate-100 text-slate-700'
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
                        <p className="text-slate-500">
                            Total: {totalElements} utilisateurs enregistrés
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                            onClick={handleSyncKeycloak}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            <span>Synchroniser Keycloak</span>
                        </button>
                        <button
                            className="flex items-center gap-2 bg-primary hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Nouvel utilisateur</span>
                        </button>
                    </div>
                </div>

                {/* Create User Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-lg font-bold text-slate-800">Créer un nouvel utilisateur</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Informations de base</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.firstName}
                                                onChange={e => setNewData({ ...newData, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.lastName}
                                                onChange={e => setNewData({ ...newData, lastName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.email}
                                                onChange={e => setNewData({ ...newData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                                            <input
                                                required
                                                type="password"
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.password}
                                                onChange={e => setNewData({ ...newData, password: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.phoneNumber}
                                                onChange={e => setNewData({ ...newData, phoneNumber: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.role}
                                                onChange={e => setNewData({ ...newData, role: e.target.value })}
                                            >
                                                <option value="PATIENT">Patient (PATIENT)</option>
                                                <option value="MEDECIN">Médecin (MEDECIN)</option>
                                                <option value="ADMIN">Admin (ADMIN)</option>
                                                <option value="GESTIONNAIRE">Gestionnaire (GESTIONNAIRE)</option>
                                                <option value="RESPONSABLE_SECURITE">Sécurité (RESPONSABLE_SECURITE)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.addressLine}
                                                onChange={e => setNewData({ ...newData, addressLine: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={newData.city}
                                                onChange={e => setNewData({ ...newData, city: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Specific Fields */}
                                {newData.role === 'PATIENT' && (
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Profil Patient</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.dateOfBirth}
                                                    onChange={e => setNewData({ ...newData, dateOfBirth: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
                                                <select
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.gender}
                                                    onChange={e => setNewData({ ...newData, gender: e.target.value })}
                                                >
                                                    <option value="MALE">Homme</option>
                                                    <option value="FEMALE">Femme</option>
                                                    <option value="OTHER">Autre</option>
                                                    <option value="PREFER_NOT_TO_SAY">Non spécifié</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Groupe Sanguin</label>
                                                <input
                                                    type="text"
                                                    placeholder="ex: A+"
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.bloodType}
                                                    onChange={e => setNewData({ ...newData, bloodType: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Assurance</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.insuranceProvider}
                                                    onChange={e => setNewData({ ...newData, insuranceProvider: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Medecin Specific Fields */}
                                {newData.role === 'MEDECIN' && (
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Profil Médecin</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Spécialisation</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.specialization}
                                                    onChange={e => setNewData({ ...newData, specialization: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de licence</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.licenseNumber}
                                                    onChange={e => setNewData({ ...newData, licenseNumber: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Années d'expérience</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.yearsOfExperience}
                                                    onChange={e => setNewData({ ...newData, yearsOfExperience: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Frais de consultation (TND)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={newData.consultationFee}
                                                    onChange={e => setNewData({ ...newData, consultationFee: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 flex gap-3 justify-end border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-teal-700 shadow-md transition-all active:scale-95"
                                    >
                                        Créer l'utilisateur
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                        >
                            <option value="ALL">Tous les rôles</option>
                            <option value="ROLE_PATIENT">Patients</option>
                            <option value="ROLE_MEDECIN">Médecins</option>
                            <option value="ROLE_ADMIN">Administrateurs</option>
                            <option value="ROLE_GESTIONNAIRE">Gestionnaires</option>
                            <option value="ROLE_RESPONSABLE_SECURITE">Sécurité</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Utilisateur</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Rôle Actuel</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                Chargement des utilisateurs...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                            Aucun utilisateur trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.keycloakId} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                        {user.role?.replace('ROLE_', '') || 'PATIENT'}
                                                    </span>
                                                    <select
                                                        className="text-xs border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                                                        value={user.role?.startsWith('ROLE_') ? user.role.replace('ROLE_', '') : user.role || 'PATIENT'}
                                                        disabled={isUpdatingRole === user.keycloakId}
                                                        onChange={(e) => handleRoleUpdate(user.keycloakId, e.target.value)}
                                                    >
                                                        <option value="PATIENT">PATIENT</option>
                                                        <option value="MEDECIN">MEDECIN</option>
                                                        <option value="ADMIN">ADMIN</option>
                                                        <option value="GESTIONNAIRE">GESTIONNAIRE</option>
                                                        <option value="RESPONSABLE_SECURITE">SÉCURITÉ</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.keycloakId)}
                                                        disabled={isDeleting === user.keycloakId || user.email === currentUser?.email}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Page {currentPage + 1} sur {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
