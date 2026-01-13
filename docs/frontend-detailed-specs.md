# Spécification Exhaustive du Frontend : MedInsight

Ce document sert de guide de référence complet pour le développement du frontend MedInsight (Localisation : Tunisie, Langue : Français).

## 🏗️ 1. Architecture & Authentification (OAuth2/Keycloak)

### 🔐 Flux d'Authentification
- **Authentification** : Gestion par `Keycloak`. Le frontend utilise le `sub` (Keycloak ID) comme identifiant unique (`patientId`, `doctorId`).
- **Persistance** : Token JWT stocké de manière sécurisée (NextAuth ou State persisté).

| **RESP_SEC** | `/security/dashboard`| [OK] Logs d'audit, Monitoring Infra. |

> [!IMPORTANT]
> **Logique de Redirection** : Le frontend lors du login privilégie les rôles de gestion (`ADMIN`, `GESTIONNAIRE`) avant les rôles métier (`PATIENT`). Les rôles sont standardisés en **MAJUSCULES**.

---

## 🗺️ 2. Navigation & Layouts

### 📱 Barre de Navigation (Commune)
- **Gauche** : Logo MedInsight + Nom de la plateforme.
- **Droite** : 
  - Sélecteur de langue (FR/AR).
  - Centre de notifications (Badge rouge pour nouveaux RDV/Résultats).
  - Avatar utilisateur -> Menu déroulant (Profil, Paramètres, Déconnexion).

### Sidebar par Rôle
- **Espace Patient** : 
  - `Tableau de bord` (Sommaire)
  - `Mes Rendez-vous` (Calendrier/Liste)
  - `Mon Dossier Médical` (Historique, Groupe sanguin)
  - `Mes Ordonnances` (Liste PDF)
- **Espace Médecin** :
  - `Planning du Jour` (Timeline)
  - `Mes Patients` (Recherche)
  - `Consultation` (Lancement rapide)
  - `Statistiques` (Volume d'activité)
- **Espace Gestionnaire** :
  - `Tableau de bord` (KPIs)
  - `Gestion du Planning` (Médecins/Salles)
  - `Fichiers Patients` (Admin)
  - `Rapports d'Activité`

---

## 🚀 3. Workflows Détaillés & Dashboards

### 🦷 Workflow : Prise de Rendez-vous (Patient)
1. **Étape 1** : Sélection de la spécialité (via `auth-service` meta indices).
2. **Étape 2** : Liste des médecins disponibles (Filtre par ville/disponibilité).
3. **Étape 3** : Choix du créneau horaire sur un calendrier interactif.
4. **Étape 4** : Saisie du motif de consultation.
5. **Confirmation** : Envoi auto d'un email via `mail-service` (Endpoint Gateway: `/api/mail/send`).

### 🩺 Workflow : Consultation Médicale (Médecin)
1. **Dashboard** : Cliquer sur "Démarrer" sur un patient en salle d'attente.
2. **Vue Dossier** : Affichage automatique de l'historique aggregé (Feign).
3. **Saisie Notes** : Zone de texte riche pour les observations.
4. **Assistant IA** : 
   - Le médecin tape les symptômes.
   - Requête vers `ml-service`.
   - Affichage des scores de probabilité (ex: Grippe 85%, COVID 12%).
5. **Ordonnance** : Génération dynamique des paliers de dosage.

### 📊 Workflow : Supervision & Reporting (Gestionnaire)
1. **Écran Utilisateurs** : Consultation de la liste globale des utilisateurs (via `/api/admin/users`).
2. **Dashboard KPIs** : Visualisation du taux d'occupation des médecins et du volume de consultations.
3. **Supervision Dossiers** : Accès en lecture seule aux dossiers médicaux pour vérification administrative.

---

## 📋 4. Formulaires & Validation (Noms de champs Backend)

### Formulaire Inscription Patient
```typescript
const patientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  phoneNumber: z.string().regex(/^\+216[0-9]{8}$/), // Format Tunisie
  dateOfBirth: z.string(), // ISO format
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodType: z.string().optional(),
  emergencyContactName: z.string(),
  emergencyContactPhone: z.string()
});
```

### Formulaire Prescription (Médicaments)
- `medicationName` : Input avec auto-complétion.
- `dosage` : ex "1 comprimé 3 fois par jour".
- `duration` : ex "7 jours".
- `instructions` : ex "A prendre après les repas".

---

## 🐳 5. Dockerisation & CI/CD Frontend

### Dockerfile (Multi-stage)
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Variables d'Environnement (Vercel/Docker)
- `NEXT_PUBLIC_GATEWAY_URL`: `http://localhost:8080/api`
- `NEXT_PUBLIC_KEYCLOAK_URL`: `http://localhost:8180`
- `NEXT_PUBLIC_REALM`: `medinsight`
- `NEXT_PUBLIC_CLIENT_ID`: `medinsight-frontend`

> [!NOTE]
> Toutes les requêtes API doivent inclure le préfixe `/api` (ex: `/api/auth/register`). La Gateway se charge de retirer ce préfixe (`StripPrefix=1`) avant de transmettre au microservice.

---

## 📊 7. Supervision Administrative (Gestionnaire)
Les écrans dédiés au gestionnaire doivent inclure :
- **Liste des Utilisateurs** : Un tableau paginé (via `/api/admin/users`) affichant :
  - Identifiants : `keycloakId`, `email`.
  - Profil : `firstName`, `lastName`.
  - Roles : Badge affichant le rôle principal.
- **Reporting & KPIs** :
  - Utilisation de `Recharts` pour visualiser le volume de rendez-vous.
  - Distribution des spécialités les plus demandées.
- **Supervision des Dossiers** : Accès simplifié en lecture seule au dossier patient pour support administratif.

---

## ✨ 8. Esthétique & UI/UX
- **Palette de couleurs** :
  - Primaire : `#10b981` (Emerald 500) - Sérénité et Santé.
  - Secondaire : `#0f172a` (Slate 900) - Professionnalisme.
- **Animations** : `Framer Motion` pour les transitions entre pages (Fade and Slide).
- **Responsive** : Design Mobile-First car beaucoup de patients utiliseront leur smartphone.
