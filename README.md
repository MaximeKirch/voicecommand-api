# 🎙️ VoiceCommand API - Intelligent Field Reporting

> **Architecture Microservices hybride (Node.js + Python) pour la structuration automatique de comptes rendus de chantier par IA.**

![Status](https://img.shields.io/badge/Status-Prototype-orange)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![Stack](https://img.shields.io/badge/Tech-NodeJS%20|%20FastAPI%20|%20Whisper%20|%20Gemini-green)

## 📖 À propos

**VoiceCommand** résout un problème critique pour les travailleurs de terrain (Architectes, BTP) : la lourdeur administrative des rapports.

L'API transforme une note vocale brute et informelle (ex: *"Le mur est fissuré, faut voir ça vendredi"*) en :

1.  **Données structurées (JSON)** : Pour l'intégration automatique dans les ERP/outils de gestion.
2.  **Rapport formaté (Markdown)** : Un compte rendu professionnel, corrigé et prêt à l'envoi par email.

## 🏗️ Architecture Technique

Ce projet implémente une architecture **Microservices** pour découpler la gestion des requêtes HTTP du traitement lourd de l'IA.

* **Gateway Service (Node.js/Express)** : Gère l'upload, la validation des fichiers, et la sécurité. Optimisé pour les I/O asynchrones.
* **AI Engine Service (Python/FastAPI)** : Gère le pipeline d'intelligence artificielle.
    * **Perception** : `faster-whisper` (implémentation CTranslate2) pour une transcription locale ultra-rapide sur CPU.
    * **Cognition** : `Google Gemini 2.5 Flash` pour l'extraction d'entités (Dates, Lots, Tâches) et la génération du rapport.

## 🚀 Stack Technologique

| Composant | Technologie | Justification |
| :--- | :--- | :--- |
| **Orchestration** | **Docker Compose** | Environnement iso-prod, réplicable en une commande. |
| **Gateway** | **Node.js (Express)** | Gestion efficace des flux de fichiers (Multer) et faible latence réseau. |
| **AI Backend** | **Python (FastAPI)** | Standard de l'industrie pour le ML/AI. |
| **Transcription** | **Faster-Whisper** | 4x plus rapide que Whisper standard, permet l'inférence CPU (`int8`). |
| **LLM** | **Gemini 2.5 Flash** | Fenêtre de contexte large, rapide et économique pour le "Structured Output". |

## 🛠️ Installation & Démarrage

**Prérequis :** Docker & Docker Compose installés, une clé API Google AI Studio.

### 1. Cloner le projet
```bash
git clone [https://github.com/votre-user/voice-command-api.git](https://github.com/votre-user/voice-command-api.git)
cd voice-command-api
````

### 2\. Configuration des variables d'environnement

Dupliquez le fichier d'exemple et ajoutez votre clé API.

```bash
cp .env.example .env
```

Ouvrez `.env` et insérez votre clé :

```env
GOOGLE_API_KEY=votre_cle_api_ici
AI_SERVICE_URL=http://voice_ai_engine:8000
```

### 3\. Lancer l'architecture

```bash
docker compose up --build
```

*Note : Le premier lancement peut prendre 1-2 minutes le temps de télécharger les images Docker et le modèle Whisper (Small).*

## 🔌 Utilisation de l'API

L'API Gateway écoute sur le port `3000`.

### Endpoint : Traitement Audio

**POST** `/process-voice`

| Paramètre | Type | Description |
| :--- | :--- | :--- |
| `audio` | File (Form-Data) | Le fichier audio (.mp3, .wav, .m4a) |

### Exemple Curl

```bash
curl -X POST http://localhost:3000/process-voice \
  -F "audio=@/chemin/vers/votre/fichier.mp3"
```

### Exemple de Réponse (JSON)

```json
{
  "success": true,
  "data": {
    "raw_transcription": "Le mur porteur est fissuré...",
    "structured_report": {
      "project_name": "Rénovation Rue de la République",
      "date": "2024-12-10",
      "trades": [
        {
          "trade_name": "Maçonnerie",
          "tasks": [
            {
              "description": "Reprise fissure mur porteur (enduit fibré)",
              "status": "Non conforme",
              "deadline": "2024-12-13"
            }
          ]
        }
      ],
      "formatted_report": "**Compte Rendu de Chantier**\n\nBonjour, voici le relevé..."
    }
  }
}
```

## 📂 Structure du Projet

```text
.
├── docker-compose.yml      # Orchestration des services
├── .env.example            # Template des secrets
├── api-gateway/            # Service Node.js
│   ├── index.js            # Point d'entrée & Routing
│   ├── Dockerfile          # Image Node Alpine
│   └── uploads/            # Stockage temporaire (non-gité)
└── ai-engine/              # Service Python
    ├── main.py             # Logique FastAPI & Pipeline AI
    ├── Dockerfile          # Image Python Slim + dépendances système
    └── requirements.txt    # Libs Python (FastAPI, Whisper, GoogleGenAI)
```

## 🔮 Roadmap & Améliorations Futures

Ce projet est un MVP fonctionnel. Pour passer à l'échelle (Production), les prochaines étapes sont :

1.  **Queue Asynchrone (Redis/BullMQ)** : Pour ne pas bloquer la requête HTTP pendant le traitement IA (actuellement synchrone).
2.  **Stockage Cloud (S3)** : Remplacer le stockage local temporaire pour supporter le scaling horizontal.
3.  **Sécurité** : Ajouter une authentification JWT sur l'API Gateway.
4.  **CI/CD** : Pipeline GitHub Actions pour les tests automatiques et le linting.

-----

**Auteur** : Maxime Kirch
**Contact** : [maxime.kirch@gmail.com](mailto:maxime.kirch@gmail.com) | [LinkedIn](https://www.linkedin.com/in/maxime-kirch/)
