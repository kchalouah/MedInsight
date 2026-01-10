"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Loader2, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

const formSchema = z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
    dateOfBirth: z.string().refine((date) => new Date(date) < new Date(), "Date invalide"),
    phoneNumber: z.string().min(8, "Numéro de téléphone requis"),
    gender: z.enum(["MALE", "FEMALE"]),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
})

export default function RegisterPatientPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        setError(null)
        try {
            // Map frontend form values to backend DTO structure
            const payload = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                password: values.password,
                phoneNumber: values.phoneNumber,
                dateOfBirth: values.dateOfBirth,
                gender: values.gender,
                addressLine: values.address?.street,
                city: values.address?.city,
                country: values.address?.country
            };

            await api.post("/auth/register/patient", payload)
            setSuccess(true)
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message || "Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-green-200 bg-white/90 backdrop-blur-sm shadow-xl">
                        <CardHeader>
                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <CardTitle className="text-center text-green-700">Inscription réussie !</CardTitle>
                            <CardDescription className="text-center">
                                Votre compte patient a été créé avec succès. Vous pouvez maintenant vous connecter.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Link href="/login" className="w-full">
                                <Button className="w-full bg-green-600 hover:bg-green-700 h-11">Se connecter</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 relative">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-2xl"
            >
                <div className="mb-4">
                    <Link href="/login" className="text-sm text-slate-500 hover:text-primary flex items-center transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Retour à la connexion
                    </Link>
                </div>

                <Card className="border-slate-200 shadow-xl bg-white/90 backdrop-blur-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-12 h-12 relative mb-2">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-teal-600">
                            Créer un compte Patient
                        </CardTitle>
                        <CardDescription>
                            Rejoignez MedInsight pour gérer votre santé simplement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input id="firstName" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("firstName")} />
                                    {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom</Label>
                                    <Input id="lastName" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("lastName")} />
                                    {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("email")} />
                                {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Input id="password" type="password" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("password")} />
                                    {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer</Label>
                                    <Input id="confirmPassword" type="password" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("confirmPassword")} />
                                    {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Date de naissance</Label>
                                    <Input id="dateOfBirth" type="date" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("dateOfBirth")} />
                                    {errors.dateOfBirth && <p className="text-xs text-red-500 font-medium">{errors.dateOfBirth.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Genre</Label>
                                    <select
                                        id="gender"
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        {...register("gender")}
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="MALE">Homme</option>
                                        <option value="FEMALE">Femme</option>
                                    </select>
                                    {errors.gender && <p className="text-xs text-red-500 font-medium">{errors.gender.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Téléphone</Label>
                                <Input id="phoneNumber" type="tel" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("phoneNumber")} />
                                {errors.phoneNumber && <p className="text-xs text-red-500 font-medium">{errors.phoneNumber.message}</p>}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <Label className="text-slate-500">Adresse (Optionnel)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input placeholder="Rue, Bâtiment..." className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("address.street")} />
                                    <Input placeholder="Ville" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("address.city")} />
                                    <Input placeholder="Code Postal" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("address.zipCode")} />
                                    <Input placeholder="Pays" defaultValue="Tunisie" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("address.country")} />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm flex items-center"
                                >
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                                    {error}
                                </motion.div>
                            )}

                            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                S'inscrire gratuitement
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center py-6 bg-slate-50/50 rounded-b-xl border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            Déjà inscrit ? <Link href="/login" className="text-primary font-semibold hover:underline">Se connecter</Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
