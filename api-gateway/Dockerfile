FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl
RUN apk add --no-cache openssl ffmpeg

COPY package*.json ./

RUN npm install

# Copie du dossier prisma
COPY prisma ./prisma

# Génération du client
RUN npx prisma generate

COPY . .

EXPOSE 3000
# On génère le client PUIS on lance le serveur
CMD ["/bin/sh", "-c", "npx prisma generate && node index.js"]
