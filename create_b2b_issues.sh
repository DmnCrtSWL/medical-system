#!/bin/bash

echo "🚀 Creando issues del backlog B2B..."

gh issue create --title "🏗️ [Backend] Setup Inicial y Modelado de BD" --body "Configurar Node, Express, Postgres y modelar tablas core (Usuarios, Clientes, Doctores, Contratos, Finanzas, Historia Clínica)." --label "enhancement"
gh issue create --title "🏗️ [Backend] Sistema de Autenticación (JWT)" --body "Endpoints de login y generación de JWT." --label "enhancement"
gh issue create --title "🏗️ [Admin] Setup Inicial del Frontend (Vue)" --body "Proyecto Vue con Tailwind, Shadcn, enrutador y store." --label "enhancement"
gh issue create --title "🏗️ [Móvil] Setup de React Native + Expo" --body "Inicialización del proyecto móvil para los doctores usando React Native y Expo." --label "enhancement" -a "yaywiin"

gh issue create --title "🏢 [Admin] Módulo de Usuarios (CRUD)" --body "CRUD para gestionar al personal administrativo interno." --label "enhancement"
gh issue create --title "🏢 [Admin] Cartera de Clientes / Corporativos" --body "CRUD para gestionar empresas que contratan los servicios in-house." --label "enhancement"
gh issue create --title "🏢 [Admin] Cartera de Doctores" --body "CRUD para la gestión del personal médico (perfil, disponibilidad, universidad)." --label "enhancement"

gh issue create --title "💰 [Admin] Generador de Contratos" --body "Generar contratos automáticamente a partir de datos del cliente." --label "enhancement"
gh issue create --title "💰 [Admin] Calendario de Contratos" --body "Vista calendario para visualizar fechas de inicio y término de contratos." --label "enhancement"
gh issue create --title "💰 [Admin] Módulo de Caja (Finanzas)" --body "Registro de ingresos por contratos y egresos por honorarios a doctores." --label "enhancement"
gh issue create --title "💰 [Admin] Dashboard de Reportes" --body "Métricas como balance de ingresos/egresos y doctores asignados." --label "enhancement"

gh issue create --title "📱 [Móvil] Login y Home del Doctor" --body "Flujo de autenticación móvil y vista principal del doctor." --label "enhancement" -a "yaywiin"
gh issue create --title "📱 [Móvil] Captura de Historia Clínica" --body "Formularios para consulta médica (datos paciente, síntomas, diagnósticos, tratamientos)." --label "enhancement" -a "yaywiin"
gh issue create --title "📱 [Backend] API para Sincronización Móvil" --body "Endpoints dedicados para recibir la información de las consultas médicas de la app móvil." --label "enhancement"

gh issue create --title "🌐 [Landing] Web B2B Explicativa" --body "Landing page de captación orientada a corporativos." --label "enhancement"

echo "✅ Issues B2B creados correctamente."
