# Feuille de Route Détaillée : Frontend MedInsight

Ce document détaille la mise en œuvre du frontend pour la plateforme MedInsight, localisée pour le marché Tunisien (Interface en Français).

## 🌍 Phase 1 : Infrastructure & Design System
- [ ] **Initialisation Technique**
  - Framework : `Next.js 14` (App Router) pour le SEO et la performance.
  - Langage : `TypeScript` pour la robustesse.
  - Style : `TailwindCSS` avec une palette "Healthcare Premium" (Emerald-500, Slate-900).
- [ ] **Configuration API & Proxy**
  - Création d'un client `Axios` avec intercepteurs pour injecter le token JWT.
  - Configuration du `next.config.js` pour gérer les rewrites vers la Gateway (`http://localhost:8080`).
- [ ] **Internationalisation (i18n)**
  - Localisation complète en Français (`fr-FR`).
  - Préparation des fichiers de traduction (`JSON`) pour une future extension en Arabe.

## 🔐 Phase 2 : Authentification OAuth2 & Keycloak
- [ ] **Intégration Keycloak**
  - Utilisation de `keycloak-js` ou `react-keycloak`.
  - Configuration du flux OAuth2 (Authorization Code Flow with PKCE).
- [ ] **Pages d'Accès**
  - Page de connexion (Login) personnalisée avec boutons "Se connecter avec Google/GitHub".
  - Parcours d'inscription (Sign-up) distincts :
    - **Patient** : Date de naissance, Numéro de carte d'identité (facultatif), Téléphone.
    - **Médecin** : Spécialité, Numéro d'ordre (License Number), Années d'expérience.
- [ ] **Gestion des Rôles**
  - Middleware de redirection automatique basés sur les rôles `ROLE_PATIENT`, `ROLE_MEDECIN`, `ROLE_GESTIONNAIRE`, `ROLE_RESPONSABLE_SECURITE`.

## 🧑‍⚕️ Phase 3 : Interface Médecin (Dashboard Médecin)
- [ ] **Tableau de Bord Principal**
  - Calendrier des rendez-vous du jour.
  - Statistiques rapides (Nombre de patients, ordonnances émises).
- [ ] **Gestion des Consultations**
  - Interface de prise de notes médicales.
  - **Module Prescription** : Formulaire intelligent pour émettre des ordonnances.
  - **Assistant IA (ML Service)** : Panneau latéral affichant les probabilités de diagnostic basées sur les symptômes saisis.
- [ ] **Dossier Médical Aggregé**
  - Vue complète du parcours patient (Historique Feign du backend).

## 🏥 Phase 4 : Interface Patient (Espace Patient)
- [ ] **Mon Agenda**
  - Prise de rendez-vous avec choix du médecin et de la spécialité.
- [ ] **Mes Documents**
  - Accès sécurisé aux ordonnances (format PDF simule ou dynamique).
  - Consultation de son propre dossier clinique (Allergies, Groupe Sanguin).

## 🛡️ Phase 5 : Sécurité & Audit (Interface Responsable Sécurité)
- [ ] **Explorateur d'Audit**
  - Tableau de bord des logs Elasticsearch (consommation du `audit-service`).
  - Filtres par utilisateur, service, et date.
- [ ] **Monitoring Système**
  - Visualisation des métriques Prometheus/Grafana via iframes ou widgets API.

## 🐳 Phase 6 : DevOps & Dockerisation
- [ ] **Dockerisation Avancée**
  - Création d'un `Dockerfile` multi-stage (Build & Nginx).
  - Utilisation de Nginx comme serveur web pour servir les fichiers statiques et gérer le reverse proxy.
- [ ] **Intégration Orchestration**
  - Ajout du service `medinsight-frontend` au fichier `docker-compose.yml`.
  - Configuration des variables d'environnement (`KEYCLOAK_URL`, `GATEWAY_URL`).

---

| Fonctionnalité | Méthode | Endpoint Gateway | Service Backend |
| :--- | :---: | :--- | :--- |
| Inscription Patient | `POST` | `/api/auth/register/patient` | `auth-service` |
| Inscription Médecin | `POST` | `/api/auth/register/medecin` | `auth-service` |
| Liste Rendez-vous | `GET` | `/api/appointments/patient/{id}` | `appointment-service` |
| Créer Rendez-vous | `POST` | `/api/appointments` | `appointment-service` |
| Émettre Ordonnance | `POST` | `/api/appointments/{id}/prescriptions` | `appointment-service` |
| Dossier Médical | `GET` | `/api/records/patient/{id}/dossier` | `medical-record-service` |
| Assistant Diagnostic | `POST` | `/api/ml/predict/diagnosis` | `ml-service` |
| Consultation Logs | `GET` | `/api/audit/logs` | `audit-service` |
| Envoi Email | `POST` | `/api/mail/send` | `mail-service` |

---

> [!IMPORTANT]
> Tous les identifiants (`patientId`, `doctorId`, `id`) doivent correspondre au **Keycloak ID** (`sub`) retourné lors de l'authentification. Le backend utilise ces IDs comme clés primaires standardisées.

### 1. Inscription Patient (`PatientRegistrationRequest`)
- `email`: (String) Adresse email valide.
- `password`: (String) Min 8 caractères.
- `firstName`, `lastName`: (String).
- `phoneNumber`: (String) Format international.
- `addressLine`, `city`, `country`: (String).
- `dateOfBirth`: (String/ISO Date) ex: `1990-01-01`.
- `gender`: (Enum) `MALE`, `FEMALE`, `OTHER`.
- `bloodType`: (String) ex: `A+`, `O-`.
- `emergencyContactName`, `emergencyContactPhone`: (String).

### 2. Inscription Médecin (`MedecinRegistrationRequest`)
- `email`, `password`, `firstName`, `lastName`, `phoneNumber`: (Mêmes que Patient).
- `specialization`: (String) ex: `Cardiologie`.
- `licenseNumber`: (String) Numéro d'ordre.
- `yearsOfExperience`: (Number).
- `consultationFee`: (Number/Decimal).

### 3. Prise de Rendez-vous (`AppointmentRequest`)
- `patientId`, `doctorId`: (UUID).
- `appointmentDateTime`: (String/ISO DateTime) ex: `2026-01-15T14:30:00`.
- `reason`: (String) Max 500 car.
- `notes`: (String) Max 500 car.

### 4. Ordonnance (`PrescriptionRequest`)
- `patientId`: (UUID).
- `medicationName`, `dosage`, `duration`: (String).
- `instructions`: (String).

### 5. Notes de Consultation (`ConsultationNoteRequest`)
- `appointmentId`, `patientId`: (UUID).
- `noteContent`: (String) Contenu détaillé de la note.

### 6. Assistant Diagnostic (ML Service)
- `symptoms`: (String) Texte libre décrivant les symptômes.
- **Réponse attendue** : `diagnosis`, `confidence`, `recommendations`.

---

## 🛠️ Stack Technique Spécifique
- **État Global** : `Zustand` ou `React Context`.
- **Formulaires** : `React Hook Form` + `Zod` (Validation stricte).
- **Notifications** : `React-Hot-Toast`.
- **Icônes** : `Lucide-React`.
