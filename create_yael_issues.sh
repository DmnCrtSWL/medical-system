#!/bin/bash

# Ensure we are in a git repository and gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "⚠️ Por favor autentica GitHub CLI corriendo: gh auth login"
    exit 1
fi

ASSIGNEE="Yaywiin"

echo "🚀 Creando issues y asignándolos a $ASSIGNEE..."

#gh issue create \
#  --title "⚙️ CI/CD: Implementar Pipeline para revisión automática" \
#  --body "Configurar un pipeline de integración continua que revise automáticamente el código antes de permitir merge en las ramas principales." \
#  --label "enhancement" \
#  --assignee "$ASSIGNEE"
#
gh issue create \
  --title "🎨 Frontend: Construir un Layout para el admin" \
  --body "Crear la estructura principal (Layout) del panel de administración (Sidebar, Header y área de contenido principal)." \
  --label "enhancement" \
  --assignee "$ASSIGNEE"

gh issue create \
  --title "🎨 Frontend: Diseño en Tailwind y Shadcn" \
  --body "Configurar TailwindCSS y la librería de componentes Shadcn-Vue, aplicando la paleta de colores y estilos acordados (bordes muy redondeados, verde menta, azul marino, etc.)." \
  --label "enhancement" \
  --assignee "$ASSIGNEE"

gh issue create \
  --title "🌗 Frontend: Implementar Modo Dark/Light" \
  --body "Añadir soporte para cambio de tema claro/oscuro en toda la aplicación administrativa, asegurando que el modo **Light** sea el predeterminado como origen." \
  --label "enhancement" \
  --assignee "$ASSIGNEE"

gh issue create \
  --title "🔐 Auth: Implementar JWT para autenticación" \
  --body "Configurar el sistema de autenticación utilizando JSON Web Tokens (JWT) para asegurar el acceso al panel administrativo." \
  --label "enhancement" \
  --assignee "$ASSIGNEE"

gh issue create \
  --title "👥 Auth: Crear Roles Administrativo y Operativo" \
  --body "Implementar la lógica de roles en el sistema de autenticación. Los roles requeridos son:
- **Administrativo**
- **Operativo**

Asegurar que las vistas y permisos se adapten según el rol." \
  --label "enhancement" \
  --assignee "$ASSIGNEE"

gh issue create \
  --title "🖥️ Frontend: Crear secciones de Admin con componentes de reúso" \
  --body "Comenzar por el Front. Crear las siguientes secciones usando componentes reutilizables:
- Estadísticas
- Usuarios
- Médicos
- Empresas
- Pacientes (con Perfil individual de paciente)

**Reglas de relación a considerar en la UI:**
- Los médicos se asignan a empresas.
- Las empresas tienen pacientes.
- Los pacientes requieren su propia vista detallada (perfil)." \
  --label "enhancement" \
  --assignee "$ASSIGNEE"

echo "✅ Todos los issues han sido creados y asignados."
