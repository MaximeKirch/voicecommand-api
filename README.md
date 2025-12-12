


# 🎙️ VoiceCommand API - Intelligent Field Reporting

> **Architecture Microservices hybride (Node.js + Python) pour la structuration automatique de comptes rendus de chantier par IA.**

![Status](https://img.shields.io/badge/Status-MVP-orange)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![Tests](https://img.shields.io/badge/Tests-Jest-brightgreen)
![Stack](https://img.shields.io/badge/Tech-NodeJS%20|%20FastAPI%20|%20Prisma%20|%20Gemini-green)

## 📖 À propos

**VoiceCommand** résout un problème critique pour les travailleurs de terrain (Architectes, BTP) : la lourdeur administrative des rapports.

L'API transforme une note vocale brute et informelle en :
1.  **Données structurées (JSON)** : Pour l'intégration automatique dans les ERP.
2.  **Rapport formaté (Markdown)** : Un compte rendu professionnel prêt à l'envoi.
3.  **Métriques d'usage** : Suivi précis de la consommation de tokens et facturation interne.

## 🏗️ Architecture Technique

Ce projet implémente une architecture **Microservices** découplée et robuste.

* **Gateway Service (Node.js/Express)** :
    * Authentification JWT (Access + Refresh Tokens avec rotation).
    * Système de facturation atomique (1 crédit = 1 minute d'audio).
    * Validation des fichiers et orchestration via Clean Architecture (Controllers/Services).
* **AI Engine Service (Python/FastAPI)** :
    * **Perception** : `faster-whisper` (implémentation CTranslate2) pour une transcription locale optimisée.
    * **Cognition** : `Google Gemini 1.5 Flash` pour l'extraction intelligente et le reporting.
* **Database (PostgreSQL + Prisma)** :
    * Gestion des utilisateurs, solde de crédits et historique des transactions.

## 🚀 Stack Technologique

| Composant | Technologie | Justification |
| :--- | :--- | :--- |
| **Orchestration** | **Docker Compose** | Environnement iso-prod, réplicable en une commande. |
| **Gateway** | **Node.js / Express** | Gestion I/O non bloquante, écosystème riche. |
| **Database** | **PostgreSQL / Prisma** | Robustesse des données relationnelles et transactions ACID (Billing). |
| **Testing** | **Jest** | Tests unitaires isolés (Mocking des dépendances système). |
| **AI Backend** | **Python / FastAPI** | Standard de l'industrie pour le ML/AI. |
| **LLM** | **Gemini 1.5 Flash** | Fenêtre de contexte large, rapide et économique. |

## 🛠️ Installation & Démarrage

**Prérequis :** Docker & Docker Compose installés, une clé API Google AI Studio.

### 1. Cloner le projet
```bash
git clone [https://github.com/votre-user/voice-command-api.git](https://github.com/votre-user/voice-command-api.git)
cd voice-command-api
````

### 2\. Configuration des variables d'environnement

Dupliquez le fichier d'exemple :

```bash
cp .env.example .env
```

Remplissez les variables (notamment `GOOGLE_API_KEY`) :

```env
GOOGLE_API_KEY=votre_cle_api_ici
AI_SERVICE_URL=http://voice_ai_engine:8000
DATABASE_URL="postgresql://voice_user:voice_password@db:5432/voice_db?schema=public"
JWT_ACCESS_SECRET=super_secret_access
JWT_REFRESH_SECRET=super_secret_refresh
```

### 3\. Lancer l'architecture

```bash
docker compose up --build
```

*L'initialisation de la base de données (Migrations Prisma) se fait automatiquement via le Dockerfile ou manuellement si nécessaire.*

## 🧪 Tests Unitaires

Le service de facturation (Billing) est couvert par des tests unitaires pour garantir qu'aucun crédit n'est débité par erreur.

```bash
docker compose exec api-gateway npm test
```

## 🔌 Utilisation de l'API

L'API Gateway écoute sur le port `3000`.

### 1\. Authentification (Login)

Récupérez un token JWT pour interagir avec l'API.
**POST** `/auth/login`

### 2\. Traitement Audio (Protégé)

**POST** `/process-voice`
*Header:* `Authorization: Bearer <votre_token>`

| Paramètre | Type | Description |
| :--- | :--- | :--- |
| `audio` | File (Form-Data) | Le fichier audio (.mp3, .wav, .m4a) |

### Exemple de Réponse (JSON)

```json
{
  "success": true,
  "data": {
    "raw_transcription": "Le mur porteur est fissuré...",
    "structured_report": {
      "project_name": "Rénovation Rue de la République",
      "date": "Vendredi 12 Décembre 2025",
      "trades": [...],
      "formatted_report": "**Compte Rendu de Chantier**\n\nBonjour..."
    },
    "usage": {
      "prompt_tokens": 293,
      "output_tokens": 611,
      "total_tokens": 904
    }
  },
  "billing": {
    "cost": 1,
    "remaining_credits": 49
  }
}
```

*Note : Le coût est calculé sur la durée de l'audio (1 crédit par minute entamée).*

## 📂 Structure du Projet

```text
.
├── docker-compose.yml       # Orchestration
├── api-gateway/             # Service Node.js (Gateway)
│   ├── controllers/         # Logique d'orchestration (VoiceController)
│   ├── services/            # Logique Métier (Billing, AI Wrapper)
│   ├── auth/                # Authentification (JWT)
│   ├── middleware/          # Protection des routes
│   ├── tests/               # Tests Unitaires (Jest)
│   ├── prisma/              # Schéma DB & Migrations
│   └── index.js             # Point d'entrée & Routing
└── ai-engine/               # Service Python (AI)
    ├── main.py              # Pipeline Whisper + Gemini
    └── Dockerfile           # Environnement Python optimisé
```

## 🔮 Roadmap

1.  **Queue Asynchrone (Redis/BullMQ)** : Découpler la réception de la requête du traitement IA pour supporter la charge.
2.  **Stockage Cloud (S3/MinIO)** : Remplacer le stockage disque local.
3.  **App Mobile (React Native)** : Interface client pour l'enregistrement et la consultation.

-----

**Auteur** : Maxime Kirch | [GitHub](https://github.com/maxime-kirch) | [LinkedIn](https://www.linkedin.com/in/maxime-kirch/)
