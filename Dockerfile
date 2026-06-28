# ════════════════════════════════════════════════════════════
# Karunada Collection — Multi-stage Docker Build
# Build context: repo root (./), Dockerfile: ./Dockerfile
# ════════════════════════════════════════════════════════════

# ── Stage 1: Build React/Vite Frontend ──────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /frontend
# Copy dependency manifests first (better layer caching)
COPY Frontend/package*.json ./
RUN npm install
# Copy all frontend source
COPY Frontend/ ./
# Build production bundle → /frontend/dist/
RUN npm run build

# ── Stage 2: Production Express Backend ─────────────────────
FROM node:20-alpine

# /app/backend mirrors local dev structure:
#   server.js uses: path.join(__dirname, '../Frontend/dist')
#   __dirname = /app/backend  →  /app/Frontend/dist  ✅
WORKDIR /app/backend

# Install production dependencies only
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source files
COPY backend/ ./

# Copy compiled React build into /app/Frontend/dist
COPY --from=frontend-build /frontend/dist /app/Frontend/dist

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
