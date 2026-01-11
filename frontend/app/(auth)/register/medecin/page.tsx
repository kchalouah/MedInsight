"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
    phoneNumber: z.string().min(8, "Numéro de téléphone requis"),
    specialization: z.string().min(2, "Spécialité requise"),
    licenseNumber: z.string().min(4, "Numéro de licence requis"),
    yearsOfExperience: z.coerce.number().min(0, "Années d'expérience invalides"),
    consultationFee: z.coerce.number().min(0, "Tarif de consultation invalide"),
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

export default function RegisterMedecinPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const { login } = useAuth()
    const router = useRouter()

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
            phoneNumber: "",
            specialization: "",
            licenseNumber: "",
            yearsOfExperience: 0,
            consultationFee: 0,
            address: {
                street: "",
                city: "",
                zipCode: "",
                country: "Tunisie"
            }
        }
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
                specialization: values.specialization,
                licenseNumber: values.licenseNumber,
                yearsOfExperience: values.yearsOfExperience,
                consultationFee: values.consultationFee,
                addressLine: values.address?.street,
                city: values.address?.city,
                country: values.address?.country
            };

            await api.post("/auth/register/medecin", payload)

            // Auto-login after successful registration
            try {
                const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8180";
                const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "medinsight";
                const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "medinsight-frontend";

                const params = new URLSearchParams();
                params.append("client_id", clientId);
                params.append("grant_type", "password");
                params.append("username", values.email);
                params.append("password", values.password);
                params.append("scope", "openid profile email");

                const response = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: params
                });

                const data = await response.json();

                if (response.ok) {
                    // Call auth context login to auto-redirect to medecin dashboard
                    login(data.access_token);
                } else {
                    // If auto-login fails, show success message and redirect to login
                    setSuccess(true)
                    setTimeout(() => router.push("/login"), 3000)
                }
            } catch (loginErr) {
                console.error("Auto-login failed:", loginErr);
                setSuccess(true)
                setTimeout(() => router.push("/login"), 3000)
            }
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
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
                                Votre compte médecin a été créé. Veuillez attendre la validation de votre licence.
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
                <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-3xl" />
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
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-primary">
                            Espace Professionnel Santé
                        </CardTitle>
                        <CardDescription>
                            Rejoignez le réseau MedInsight pour optimiser votre pratique médicale.
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
                                <Label htmlFor="email">Email Professionnel</Label>
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
                                    <Label htmlFor="specialization">Spécialité</Label>
                                    <Input id="specialization" placeholder="ex: Cardiologie" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("specialization")} />
                                    {errors.specialization && <p className="text-xs text-red-500 font-medium">{errors.specialization.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="licenseNumber">Numéro de Licence (CNOM)</Label>
                                    <Input id="licenseNumber" placeholder="Numéro d'ordre..." className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("licenseNumber")} />
                                    {errors.licenseNumber && <p className="text-xs text-red-500 font-medium">{errors.licenseNumber.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="yearsOfExperience">Années d'expérience</Label>
                                    <Input id="yearsOfExperience" type="number" min="0" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("yearsOfExperience")} />
                                    {errors.yearsOfExperience && <p className="text-xs text-red-500 font-medium">{errors.yearsOfExperience.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="consultationFee">Tarif de consultation (DT)</Label>
                                    <Input id="consultationFee" type="number" min="0" step="0.5" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("consultationFee")} />
                                    {errors.consultationFee && <p className="text-xs text-red-500 font-medium">{errors.consultationFee.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Téléphone Professionnel</Label>
                                <Input id="phoneNumber" type="tel" className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("phoneNumber")} />
                                {errors.phoneNumber && <p className="text-xs text-red-500 font-medium">{errors.phoneNumber.message}</p>}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <Label className="text-slate-500">Adresse Cabinet</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="md:col-span-3">
                                        <Input placeholder="Rue, Bâtiment..." className="h-10 border-slate-300 focus:border-primary focus:ring-primary/20" {...register("address.street")} />
                                    </div>
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
                                S'inscrire comme Médecin
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center py-6 bg-slate-50/50 rounded-b-xl border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            Déjà un compte ? <Link href="/login" className="text-primary font-semibold hover:underline">Se connecter</Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
