"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Lock, Phone, MapPin, ArrowLeft } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    firstName: z.string().min(2, "Prénom requis"),
    lastName: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    phoneNumber: z.string().min(8, "Numéro de téléphone invalide"),
    password: z.string().min(8, "Mot de passe minimum 8 caractères"),
    confirmPassword: z.string(),
    addressLine: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
})

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            phoneNumber: "",
            password: "",
            confirmPassword: "",
            addressLine: "",
            city: "",
            country: "",
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        setError(null)
        try {
            // TODO: Call backend API to update user profile
            await api.put(`/users/${user?.keycloakId}`, values)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            console.error("Profile update error:", err)
            setError(err.response?.data?.message || "Erreur lors de la mise à jour du profil")
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) {
        router.push("/login")
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </button>
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Déconnexion
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="border-slate-200 shadow-xl bg-white/90 backdrop-blur-md">
                        <CardHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {success && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                    ✅ Profil mis à jour avec succès
                                </div>
                            )}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    ⚠️ {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Prénom</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="firstName"
                                                {...register("firstName")}
                                                className="pl-10 h-10 border-slate-300 focus:border-primary"
                                            />
                                        </div>
                                        {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Nom</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="lastName"
                                                {...register("lastName")}
                                                className="pl-10 h-10 border-slate-300 focus:border-primary"
                                            />
                                        </div>
                                        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register("email")}
                                            disabled
                                            className="pl-10 h-10 border-slate-300 bg-slate-50"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">L'email ne peut pas être modifié</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="phoneNumber"
                                            {...register("phoneNumber")}
                                            className="pl-10 h-10 border-slate-300 focus:border-primary"
                                            placeholder="+216 XX XXX XXX"
                                        />
                                    </div>
                                    {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
                                </div>

                                <div className="border-t border-slate-200 pt-5 mt-5">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Adresse</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="addressLine">Rue</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="addressLine"
                                                    {...register("addressLine")}
                                                    className="pl-10 h-10 border-slate-300 focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">Ville</Label>
                                                <Input
                                                    id="city"
                                                    {...register("city")}
                                                    className="h-10 border-slate-300 focus:border-primary"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="country">Pays</Label>
                                                <Input
                                                    id="country"
                                                    {...register("country")}
                                                    className="h-10 border-slate-300 focus:border-primary"
                                                    defaultValue="Tunisie"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-5 mt-5">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Modifier le mot de passe</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Nouveau mot de passe</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    {...register("password")}
                                                    className="pl-10 h-10 border-slate-300 focus:border-primary"
                                                    placeholder="Laisser vide pour ne pas modifier"
                                                />
                                            </div>
                                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    {...register("confirmPassword")}
                                                    className="pl-10 h-10 border-slate-300 focus:border-primary"
                                                />
                                            </div>
                                            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 h-11 text-base font-medium"
                                    >
                                        {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                                        Enregistrer les modifications
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        className="h-11"
                                    >
                                        Annuler
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
