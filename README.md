# 🩺 MedInsight : Plateforme E-Santé Intelligente

MedInsight est une plateforme de santé numérique basée sur une architecture microservices robuste, conçue pour moderniser la gestion des patients, des médecins et des soins médicaux. Elle intègre des fonctionnalités avancées d'intelligence artificielle pour l'aide au diagnostic et une sécurité de niveau entreprise via Keycloak.

---

## 🚀 Fonctionnalités Clés

- **Gestion des Utilisateurs & Rôles** : Authentification centralisée avec Keycloak (Authorization Code Flow + PKCE). Rôles : Patient, Médecin, Gestionnaire, Administrateur, Responsable Sécurité.
- **Prise de Rendez-vous** : Système de planification intelligent avec détection de conflits.
- **Dossier Médical Partagé (DMP)** : Centralisation des antécédents, allergies et notes de consultation.
- **Assistant Diagnostic IA** : Analyse des symptômes via un service ML (Python FastAPI) pour assister les médecins.
- **Module Ordonnance** : Génération numérique sécurisée de prescriptions.
- **Audit & Conformité** : Traçabilité complète des actions via un service d'audit dédié stocké dans Elasticsearch.
- **Notifications par Email** : Rappels automatiques et alertes personnalisées via SMTP/Thymeleaf.

---

## 🏗️ Architecture Technique

La solution repose sur une architecture microservices dockerisée :

- **Gateway API (Spring Cloud Gateway)** : Point d'entrée unique (Port 8080). Gère le routing unifié via `StripPrefix=1`.
- **Service Découverte (Eureka)** : Enregistrement et découverte (Port 8761).
- **Service Authentification (Auth Service)** : Authentification et profils (Port 8081).
- **Service Rendez-vous** : Gestion RDV et ordonnances (Port 8082).
- **Service Dossier Médical** : DMP et agrégation clinique (Port 8084).
- **Service Audit** : Traçabilité via Elasticsearch (Port 8085).
- **Service ML** : Prédictions médicales IA (Port 8000).
- **Service Mail** : Notifications SMTP (Port 8086).

---

## 🛠️ Stack Technique

- **Backend** : Java 21, Spring Boot 3, Spring Cloud, Spring Security, FastAPI (Python).
- **Persistance** : PostgreSQL, Elasticsearch (Audit).
- **Sécurité** : Keycloak (OAuth2 / OIDC).
- **Audit & Logs** : Elasticsearch, Grafana Loki, Grafana dashboard.
- **Infrastructure** : Docker, Docker Compose.
- **Frontend** : Next.js 14, TailwindCSS, TypeScript (Implémenté).

---

## 🚦 Installation & Démarrage

### Prérequis
- Docker & Docker Compose
- Java 17 (pour le développement local)
- Maven 3.9+

### Démarrage Rapide
1. Clonez le dépôt.
2. Configurez vos variables d'environnement dans le fichier `.env`.
3. Lancez toute l'infrastructure avec Docker Compose :
   ```bash
   docker-compose up --build -d
   ```
4. Accédez au tableau de bord Eureka sur `http://localhost:8761` pour vérifier que tous les services sont enregistrés.

---

---

## 📁 Documentation & Routing API

Le système utilise une stratégie de routing unifiée : `http://localhost:8080/api/{service-prefix}/**`.

- **Swagger UI** : `http://localhost:8080/swagger-ui.html` (Agrégation de tous les services).
- **OpenAPI Specs** : Accessibles via `/api/{service}/v3/api-docs`.
- **Docs détaillées** : Consultez le dossier `/docs` pour les contrats API de chaque service.

---

## 📊脚本 de Population de Données
Pour tester la plateforme avec des données réalistes, utilisez le script Python situé dans `/scripts` :
```bash
cd scripts
pip install -r requirements.txt
python populate_data.py
```

---

## 👨‍💻 Contribution
Le projet suit une méthodologie de développement modulaire. Pour ajouter un nouveau microservice, référez-vous au `parent pom.xml` dans le dossier `Backend/`.

---

## ⚖️ Licence
Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.
