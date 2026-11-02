# Stage 1: Build React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Build production bundle inside the container (/app/dist)
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

# Copy compiled production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
