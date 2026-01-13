# Feuille de Route Détaillée : Frontend MedInsight

Ce document détaille la mise en œuvre du frontend pour la plateforme MedInsight, localisée pour le marché Tunisien (Interface en Français).

## 🌍 Phase 1 : Infrastructure & Design System
- [x] **Initialisation Technique**
  - Framework : `Next.js 14` (App Router)
  - Style : `TailwindCSS` "Healthcare Premium"
- [x] **Configuration API & Proxy**
  - Client `Axios` avec intercepteurs JWT.
- [x] **Internationalisation (i18n)**
  - Localisation complète en Français.

## 🔐 Phase 2 : Authentification OAuth2 & Keycloak
- [x] **Intégration Keycloak**
  - OAuth2 Flow avec PKCE.
- [x] **Pages d'Accès**
  - Login et Registration (Patient/Médecin).
- [x] **Gestion des Rôles**
  - Redirections Dashboard automatiques.

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
- [x] **Mon Agenda**
  - Dashboard récapitulatif.
  - Formulaire de prise de RDV multi-étapes.
- [x] **Mes Documents**
  - Accès au Dossier Médical (Allergies, Antécédents).
  - Consultation des notes et ordonnances.

## 🛡️ Phase 5 : Sécurité & Audit (Interface Responsable Sécurité)
- [x] **Explorateur d'Audit**
  - Reporting des logs Elasticsearch.
- [x] **Monitoring Système**
  - QuickLinks vers Grafana, Prometheus, Eureka, Keycloak, pgAdmin.

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
