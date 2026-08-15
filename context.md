# Medical Management System - Context & Guidelines

Este archivo proporciona el contexto inicial para cualquier desarrollador o agente de Inteligencia Artificial que se una al proyecto.

## 1. Stack Tecnológico
- **Frontend / Portal / Admin:** Vue, TailwindCSS, Componentes prediseñados de Shadcn.
- **Backend:** Node.js, Express.
- **Base de Datos:** PostgreSQL (localmente en desarrollo).
- **Móvil:** Desarrollo Nativo (App iOS y Android - `mobile-native`).

## 2. Lineamientos de UX/UI
Como especialista UX/UI, aplica estas reglas de diseño en todo el ecosistema:
- **Esquema de Colores:** Verde Menta, Azul Marino y Blanco.
- **Atmósfera Visual:** Espacio amplio, limpieza visual y formas "muy redonditas" (usar border-radius amplios).
- **Iconografía:** Elegante, líneas delgadas, terminaciones circulares.
- **Componentes:** Basados en Shadcn para un aspecto premium, utilizando radios de borde generosos.

## 3. Valor Core del Sistema (Analítica)
El sistema no es solo un registro médico. Su valor principal (B2B) es reinterpretar la data recabada por los doctores para generar estadísticas y métricas de salud a largo plazo para las empresas que contratan el servicio.

## 3. Ways of Working (WoW) y Reglas del Equipo
- **Calidad (QA) y Despliegue:** NUNCA se sube nada a producción sin un proceso riguroso de QA y sin la validación (OK) de los pipelines de Infraestructura y CI/CD.
- **Comunicación e Integración:** Sistema basado en revisión de Pull Requests (PRs). Implementar la "regla de la pelota" para comunicación asíncrona interna (claridad sobre quién tiene el turno de accionar).

## 4. Estructura del Repositorio
- `/admin` - Sistema de administración central (Vue).
- `/backend` - API y base de datos (Node, Express, Postgres).
- `/mobile-native` - Aplicaciones móviles.
- `/portal` - Portal del paciente (segunda fase).
- `/landing` - Página web explicativa e informativa.

## 5. Cronograma de Entregas (Q3-Q4 2026)
- **14 Ago:** Sistema de diseño, Web explicativa, Maqueta base Admin.
- **28 Ago (Sprint 1):** Infraestructura, BD y Autenticación.
- **11 Sep (Sprint 2):** Core Administrativo y Doctores.
- **25 Sep (Sprint 3):** Pacientes y Contratos Empresariales.
- **09 Oct (Sprint 4):** Estadísticas.
- **23 Oct (Sprint 5):** Inicio App Móvil.
- **06 Nov (Sprint 6):** App Móvil Core.
- **19 Nov (Sprint 7):** Portal del Paciente (Entregado Jueves).
- **04 Dic (Sprint 8):** Pruebas Integrales QA.
- **11 Dic (Sprint 9):** Release General de Pruebas.
