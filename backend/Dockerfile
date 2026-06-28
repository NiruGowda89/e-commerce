# ════════════════════════════════════════════════════════
# Stage 1 — Build Frontend React App
# ════════════════════════════════════════════════════════
FROM node:20-alpine AS frontend-build

WORKDIR /build/Frontend
# Install deps first (better Docker layer caching)
COPY Frontend/package*.json ./
RUN npm install
# Copy rest of Frontend source
COPY Frontend/ ./
RUN npm run build
# Result: /build/Frontend/dist/

# ════════════════════════════════════════════════════════
# Stage 2 — Run Backend Express Server
# ════════════════════════════════════════════════════════
FROM node:20-alpine

WORKDIR /app/backend

# Install production deps only
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source
COPY backend/ ./

# Copy the React build into ../Frontend/dist relative to backend/
# server.js uses: path.join(__dirname, '../Frontend/dist')
# __dirname = /app/backend, so target = /app/Frontend/dist
COPY --from=frontend-build /build/Frontend/dist /app/Frontend/dist

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
