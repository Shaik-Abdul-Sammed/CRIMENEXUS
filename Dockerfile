# Stage 1: Build React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Verify PDF dossier existence
RUN if [ -f /app/public/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf ]; then \
      echo "[Dockerfile] PDF dossier found — will be baked into image"; \
    else \
      echo "[Dockerfile] WARNING: PDF dossier missing — 404 will occur on /CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"; \
    fi

# Build production bundle inside the container (/app/dist)
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

# Copy compiled production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure PDF dossier and public static assets are directly in webroot and /public
COPY public/ /usr/share/nginx/html/
COPY public/ /usr/share/nginx/html/public/

# Copy Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
