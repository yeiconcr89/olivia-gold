# Multi-stage build for frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Production stage for frontend
FROM nginx:alpine AS frontend-production

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]