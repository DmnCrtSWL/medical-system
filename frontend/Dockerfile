# Stage 1: Build de Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Configurar VITE_API_URL=/api para que las llamadas se hagan relativamente a través del proxy inverso de Nginx
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Runner Nginx
FROM nginx:alpine AS runner

# Copiar configuración de Nginx para SPA y Reverse Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
