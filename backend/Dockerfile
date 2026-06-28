# Stage 1 — Build Frontend React App
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# Stage 2 — Run Backend Express Server
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --only=production
COPY backend/ ./
# Copy compiled frontend build assets (preserves the relative path structure ../frontend/dist)
COPY --from=frontend-build /frontend/dist /frontend/dist

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
