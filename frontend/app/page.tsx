"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, ShieldCheck, Stethoscope, FileText, BrainCircuit, Mail, ArrowRight, HeartPulse } from "lucide-react"
import { motion, Variants } from "framer-motion"


export default function Home() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 50, damping: 20 }
    }
  }

  return (
    <div className="flex flex-col min-h-screen font-body overflow-x-hidden relative">
      {/* Global Animated Background Elements */}
      <div className="fixed inset-0 -z-10 bg-slate-50/50 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-teal-400/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Header */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-white/40 bg-white/60 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <Link className="flex items-center gap-3 group" href="#">
          <div className="relative w-10 h-10 transition-transform group-hover:scale-110 duration-300">
            <Image src="/logo.png" alt="MedInsight Logo" fill className="object-contain" />
          </div>
          <span className="font-sans font-bold text-2xl text-slate-900 tracking-tight group-hover:text-primary transition-colors">MedInsight</span>
        </Link>

        <nav className="hidden md:flex gap-8 items-center">
          {['Fonctionnalités', 'À propos', 'Contact'].map((item) => (
            <Link key={item} className="text-sm font-medium text-slate-600 hover:text-primary transition-all hover:scale-105 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full" href="#">
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="rounded-full px-6">Se connecter</Button>
          </Link>
          <Link href="/login">
            <Button className="rounded-full px-6">Commencer</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 relative overflow-hidden flex items-center justify-center">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center max-w-5xl mx-auto">

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/60 border border-white/50 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur-md"
              >
                <HeartPulse className="w-4 h-4 fill-primary/20" />
                <span>La référence E-Santé en Tunisie </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-sans text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl leading-[1.1] drop-shadow-sm"
              >
                Votre Santé, <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-primary to-indigo-600 animate-gradient-x">Connectée & Intelligente</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mx-auto max-w-2xl text-slate-600 md:text-xl leading-relaxed"
              >
                Une plateforme unifiée qui révolutionne la relation patient-médecin grâce à l'intelligence artificielle et un dossier médical partagé sécurisé.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link href="/register/patient">
                  <Button size="lg" className="h-14 px-10 text-lg rounded-full font-bold shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 hover:scale-105 transition-all duration-300">
                    Créer mon dossier gratuit
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full border-2 border-slate-200 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-primary/30 hover:text-primary transition-all">
                    Découvrir la plateforme
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 bg-white/0 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-sans text-3xl font-bold text-slate-900 md:text-5xl">Tout ce dont vous avez besoin</h2>
              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto">Des outils puissants conçus pour simplifier votre parcours de soin.</p>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {[
                { icon: CalendarCheck, title: "Prise de Rendez-vous", desc: "Planification intelligente 24/7 avec synchronisation en temps réel et rappels automatiques.", color: "bg-blue-50 text-blue-600" },
                { icon: FileText, title: "Dossier Médical (DMP)", desc: "Centralisez vos antécédents, allergies et comptes-rendus dans un espace ultra-sécurisé.", color: "bg-teal-50 text-teal-600" },
                { icon: BrainCircuit, title: "Assistant IA", desc: "Une intelligence artificielle avancée pour analyser vos symptômes et orienter le diagnostic.", color: "bg-violet-50 text-violet-600" },
                { icon: ShieldCheck, title: "Sécurité Maximale", desc: "Protection de niveau bancaire avec chiffrement de bout en bout et authentification forte.", color: "bg-indigo-50 text-indigo-600" },
                { icon: Stethoscope, title: "Ordonnance Numérique", desc: "Recevez vos prescriptions directement sur votre mobile, sécurisées et infalsifiables.", color: "bg-emerald-50 text-emerald-600" },
                { icon: Mail, title: "Notifications Intelligentes", desc: "Ne manquez plus aucun soin grâce aux alertes personnalisées par mail et SMS.", color: "bg-rose-50 text-rose-600" },
              ].map((feature, index) => (
                <motion.div key={index} variants={item} className="h-full">
                  <Card className="h-full border border-slate-100 bg-white/60 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 group rounded-3xl overflow-hidden">
                    <CardHeader className="p-8">
                      <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <feature.icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 mb-3">{feature.title}</CardTitle>
                      <CardDescription className="text-base text-slate-600 leading-relaxed">{feature.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden w-full flex justify-center">
          <div className="absolute inset-0 bg-slate-900 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20 opacity-90" />
            {/* Symmetrical Abstract Shapes */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-indigo-500/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-0 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto space-y-8 px-4"
            >
              <h2 className="font-sans text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
                Prêt à transformer votre expérience médicale ?
              </h2>
              <p className="text-slate-300 text-xl md:text-2xl mb-10 leading-relaxed">
                Rejoignez des milliers de patients et professionnels de santé qui font confiance à MedInsight.
              </p>

              <div className="flex justify-center">
                <div className="flex flex-col sm:flex-row gap-5 items-center">
                  <Link href="/register/medecin">
                    <Button
                      size="lg"
                      className="h-16 px-10 text-lg font-bold rounded-full bg-teal-500 hover:bg-teal-400 text-white border-0 shadow-lg shadow-teal-500/30 hover:scale-105 transition-transform w-full sm:w-auto"
                    >
                      Je suis Médecin <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  <Link href="/register/patient">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-16 px-10 text-lg font-bold rounded-full border-2 border-slate-600 bg-transparent text-white hover:bg-white hover:text-slate-900 hover:border-white transition-all w-full sm:w-auto"
                    >
                      Je suis Patient
                      <span className="ml-2 h-5 w-5 opacity-0">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <footer className="py-8 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 grayscale opacity-50">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-sm text-slate-500 font-medium">© 2024 MedInsight Inc.</span>
          </div>

          <nav className="flex gap-6">
            {['Conditions', 'Confidentialité', 'Sécurité', 'Aide'].map((link) => (
              <Link key={link} href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">
                {link}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
