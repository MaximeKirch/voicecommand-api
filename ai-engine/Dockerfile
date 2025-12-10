FROM python:3.10-slim

# INSTALLATION DES DÉPENDANCES SYSTÈME CRITIQUES
# libgomp1 : Nécessaire pour faster-whisper (CTranslate2)
# ffmpeg : Nécessaire pour traiter l'audio
RUN apt-get update && apt-get install -y \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie et installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# IMPORTANT : Le chargement du modèle peut prendre du temps au premier lancement.
# On augmente le timeout des workers si nécessaire, mais ici on lance juste uvicorn.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
