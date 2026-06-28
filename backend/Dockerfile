# ════════════════════════════════════════════════════════════
# Karunada Collection — Standalone Backend Build
# Build context: backend/ (./), Dockerfile: backend/Dockerfile
# ════════════════════════════════════════════════════════════

FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy backend source files
COPY . .

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
