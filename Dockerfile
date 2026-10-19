# ==============================================================================
# BATIPROMO DZ - Dockerfile Multi-Stage pour Production & Render Cloud
# ==============================================================================

# Étape 1 : Construction du Frontend React
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Installation des dépendances client
COPY client/package*.json ./
RUN npm ci

# Compilation des assets de production
COPY client/ ./
RUN npm run build

# Étape 2 : Exécution de l'Application Node.js
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Installation des dépendances serveur de production
COPY package*.json ./
RUN npm ci --omit=dev

# Copie du code backend et du frontend compilé
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist
COPY batipromo.db* ./

# Répertoire pour les uploads de documents
RUN mkdir -p /app/server/uploads

EXPOSE 5000

# Démarrage de l'application
CMD ["node", "server/index.js"]
