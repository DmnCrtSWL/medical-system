#!/bin/bash

# Ensure we are in a git repository and gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "⚠️ Por favor autentica GitHub CLI corriendo: gh auth login"
    exit 1
fi

echo "🚀 Creando issues en GitHub..."

# 1. Tareas base (Infraestructura y Configuración)
gh issue create --title "⚙️ Infra: Configuración Inicial del Repositorio" --body "Crear estructura de carpetas: admin, mobile-native, portal, landing, backend. Subir archivo de contexto (context.md)." --label "enhancement"
gh issue create --title "⚙️ Infra: Configuración de CI/CD (Pipeline)" --body "Configurar GitHub Actions para el pipeline de CI/CD. Agregar reglas de validación para QA y protección de la rama principal (prohibido subir a main sin revisión/QA)." --label "enhancement"
gh issue create --title "⚙️ Infra: Configurar Base de Datos PostgreSQL" --body "Crear y conectar la base de datos PostgreSQL en entorno local para desarrollo (docker-compose.yml)." --label "enhancement"
gh issue create --title "🎨 Diseño: Instalar e inicializar Shadcn" --body "Inicializar Tailwind y Shadcn en la carpeta /admin siguiendo la paleta de colores del contexto (azul marino, turquesas, limpio, redondeado)." --label "design"

# 2. Tareas del Viernes (Mismas del Project Board)
gh issue create --title "🎨 Diseño: Sistema de Diseño y Mockups (Viernes)" --body "Entregar maquetas iniciales del sistema base de administrador utilizando las directrices de UX/UI establecidas." --label "design"
gh issue create --title "🌐 Frontend: Crear Web Explicativa (Viernes)" --body "Desarrollar la página web (/landing) que contenga el cronograma de entregas (hasta el 11 de diciembre) para el cliente." --label "enhancement"
gh issue create --title "🧠 UX: Entrevista de flujos (Grill Me)" --body "Definir flujos de trabajo del administrador y CRUDs básicos." --label "documentation"
gh issue create --title "🎨 Diseño: Definir Branding y Nombre" --body "[Jesus Balderas] Trabajar con Marquito para definir el nombre y la identidad visual de la aplicacion medica." --label "design"

echo "✅ Todos los issues han sido creados en GitHub exitosamente."
