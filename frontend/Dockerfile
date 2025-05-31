FROM node:18-alpine AS base
WORKDIR /app

# Set up dependencies
FROM base AS deps
COPY package*.json ./

# Install dependencies with better caching
RUN npm ci

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create production-ready environment variables for API connection
ARG REACT_APP_API_URL=/api
ARG REACT_APP_WS_URL=/ws
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}

# Build the app with production optimization
RUN npm run build

# Production image with nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Install needed utilities
RUN apk add --no-cache curl bash iputils bind-tools

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build .

# Create startup script using a more reliable method
RUN set -e \
    && { \
       echo '#!/bin/bash'; \
       echo ''; \
       echo 'echo "Starting Nginx with backend proxy..."'; \
       echo 'echo "Runtime environment:"'; \
       echo 'echo "BACKEND_HOST=${BACKEND_HOST:-backend}"'; \
       echo 'echo "BACKEND_PORT=${BACKEND_PORT:-8080}"'; \
       echo 'echo "BACKEND_WS_PORT=${BACKEND_WS_PORT:-8088}"'; \
       echo ''; \
       echo '# Set backend host from environment or use default'; \
       echo 'BACKEND=${BACKEND_HOST:-backend}'; \
       echo 'BACKEND_PORT=${BACKEND_PORT:-8080}'; \
       echo 'BACKEND_WS_PORT=${BACKEND_WS_PORT:-8088}'; \
       echo ''; \
       echo '# Print DNS info for debugging'; \
       echo 'echo "Docker DNS configuration:"'; \
       echo 'cat /etc/resolv.conf'; \
       echo ''; \
       echo 'echo "Checking DNS resolution for $BACKEND..."'; \
       echo 'nslookup $BACKEND || echo "Warning: Cannot resolve $BACKEND"'; \
       echo ''; \
       echo '# Try direct ping to verify network connectivity'; \
       echo 'echo "Testing network connectivity to $BACKEND..."'; \
       echo 'ping -c 2 $BACKEND || echo "Warning: Cannot ping $BACKEND"'; \
       echo ''; \
       echo '# Explicitly update nginx.conf with correct backend settings'; \
       echo 'echo "Configuring Nginx to use backend at $BACKEND:$BACKEND_PORT"'; \
       echo 'sed -i "s|http://tmdt-backend:|http://$BACKEND:|g" /etc/nginx/conf.d/default.conf'; \
       echo 'sed -i "s|http://backend:|http://$BACKEND:|g" /etc/nginx/conf.d/default.conf'; \
       echo 'sed -i "s|:8080|:$BACKEND_PORT|g" /etc/nginx/conf.d/default.conf'; \
       echo 'sed -i "s|:8088|:$BACKEND_WS_PORT|g" /etc/nginx/conf.d/default.conf'; \
       echo ''; \
       echo '# Show final nginx configuration'; \
       echo 'echo "Final Nginx configuration:"'; \
       echo 'cat /etc/nginx/conf.d/default.conf'; \
       echo ''; \
       echo '# Wait for backend to be available'; \
       echo 'echo "Waiting for backend to be available at $BACKEND:$BACKEND_PORT..."'; \
       echo 'for i in $(seq 1 30); do'; \
       echo '  if curl -s -f -o /dev/null http://$BACKEND:$BACKEND_PORT/actuator/health || curl -s -f -o /dev/null http://$BACKEND:$BACKEND_PORT/api/products; then'; \
       echo '    echo "Backend is available!"'; \
       echo '    break'; \
       echo '  fi'; \
       echo '  echo "Waiting for backend (attempt $i/30)..."'; \
       echo '  sleep 2'; \
       echo 'done'; \
       echo ''; \
       echo '# Start Nginx'; \
       echo 'echo "Configuration complete, starting Nginx..."'; \
       echo 'exec "$@"'; \
    } > /docker-entrypoint.d/40-wait-for-backend.sh \
    && chmod +x /docker-entrypoint.d/40-wait-for-backend.sh

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

# Use default CMD to start nginx
CMD ["nginx", "-g", "daemon off;"]