#!/bin/sh
set -e

echo "⏳ Esperando a que PostgreSQL esté listo..."
CLEAN_DB_URL=$(echo "$DATABASE_URL" | sed 's/?.*//')
until pg_isready -d "$CLEAN_DB_URL"; do
  echo "Esperando por PostgreSQL..."
  sleep 2
done

echo "✅ Base de datos disponible."

echo "🔄 Sincronizando esquema de base de datos con Prisma..."
npx prisma db push --skip-generate

echo "🌱 Asegurando datos iniciales (Seed)..."
node dist/seed.js || echo "⚠️ Seed finalizado (datos ya existentes)."

echo "🚀 Iniciando API Backend en puerto ${PORT:-4000}..."
exec node dist/index.js
