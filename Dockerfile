# Étape 1 : Construction du Frontend Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Étape 2 : Production Runner Node.js
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Dépendances serveur
COPY package*.json ./
RUN npm ci --only=production

# Copie du backend et du client buildé
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Répertoire pour les uploads et la base de données SQLite
VOLUME ["/app/server/uploads", "/app/data"]

EXPOSE 5000

CMD ["node", "server/index.js"]
