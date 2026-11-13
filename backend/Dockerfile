FROM node:20-alpine AS builder

WORKDIR /app

# Instalar herramientas requeridas por Prisma
RUN apk add --no-cache openssl

# Copiar archivos de manifiesto y esquema
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo dev para compilar TypeScript)
RUN npm ci

# Copiar configuración y código fuente
COPY tsconfig.json ./
COPY src ./src/

# Generar cliente de Prisma y compilar TS a JS en /dist
RUN npx prisma generate
RUN npm run build

# Stage 2: Imagen de Producción (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar utilidades del sistema para Prisma y pg_isready
RUN apk add --no-cache openssl postgresql-client

# Copiar dependencias ya generadas y esquema
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Copiar script de arranque
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Crear directorio para almacenamiento persistente de cédulas y documentos
RUN mkdir -p uploads

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

ENTRYPOINT ["./entrypoint.sh"]
