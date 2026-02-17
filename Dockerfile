# Build stage: build React + Vite
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source & build (VITE_API_BASE_URL di-inject dari docker-compose)
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Run stage: serve static files dengan nginx
FROM nginx:alpine AS runtime
# Salin hasil build ke direktori default nginx
COPY --from=build /app/dist /usr/share/nginx/html
# SPA: fallback ke index.html untuk client-side routing
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
