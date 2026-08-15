# Medical Management System

¡Bienvenido al repositorio del Medical Management System! 🏥

Este sistema es una plataforma B2B enfocada en gestionar y proveer personal médico a empresas. Funciona como el puente administrativo e integrador entre los doctores y los corporativos (clientes) que implementan consultorios médicos in-house para sus empleados.

## 📌 ¿De qué trata la aplicación?

El ecosistema se divide en las siguientes piezas clave:

1. **Sistema Administrativo (`/admin`):** El panel de control central para la empresa proveedora de los servicios. **No es para uso clínico**, sino operativo y administrativo. Sus funciones principales son:
   - **Control de Usuarios (CRUD):** Para gestionar los accesos del personal interno.
   - **Cartera de Clientes:** Gestión de empresas que contratan los servicios, y su historial de contratos.
   - **Generación de Contratos:** Creador automatizado de contratos de prestación de servicios con datos precargados del cliente.
   - **Cartera de Doctores (CRUD):** Base de datos del personal médico (quiénes son, edad, universidad, experiencia, disponibilidad y calificación).
   - **Módulo de Finanzas / Caja:** Registro y control administrativo de ingresos (por pago de contratos) y gastos (pago de honorarios a doctores).
   - **Reportes Administrativos:** Métricas clave (asignaciones de doctores por empresa, balance de ingresos vs pago de salarios).
   - **Calendario:** Vista estilo Google Calendar que muestra las fechas de término de cada contrato, enlazado directamente a los detalles del mismo.

2. **Aplicaciones Móviles (`/mobile-native`):** La herramienta de trabajo para los **doctores**. Su función principal es recabar la información durante la consulta médica en la empresa:
   - Captura de datos personales del paciente (empleado).
   - Registro de síntomas, enfermedades, diagnósticos y tratamientos.
   - Creación y actualización de la **Historia Clínica** (Archivo Clínico).

3. **Portal del Paciente (`/portal`):** *(Fase posterior)* Interfaz para el usuario final.

4. **Backend Central (`/backend`):** El motor principal que orquesta la lógica de negocio y almacena la información (Node.js, Postgres).

5. **Web Explicativa (`/landing`):** Página de presentación ofreciendo el servicio B2B.

## 🛠️ Tecnologías Principales
- **Frontend / Web:** Vue, TailwindCSS, Componentes Shadcn.
- **Backend:** Node.js, Express, PostgreSQL.
- **Móvil:** React Native + Expo (Código base único para iOS y Android).

## 🤝 Flujo de Trabajo (Para Yael y el equipo)
- **Control de Tareas:** Usamos **Issues** de GitHub para mapear cada tarea del proyecto.
- **Integración de Código:** Todo desarrollo debe ser enviado mediante **Pull Requests (PRs)**. 
- **Regla de la Pelota:** Mantén siempre la claridad de quién tiene el turno de accionar en un PR o Issue para que el trabajo asíncrono fluya sin bloqueos.
- **QA:** Nada se fusiona sin pasar revisión y las pruebas correspondientes.

> **Regla de Privacidad (Contexto):** Al desarrollar, bajo ninguna circunstancia se deben dejar datos financieros reales, tarifas del mundo real, o información sensible "hardcodeada" en el código o en los commits. Todo valor debe ser de prueba o dinámico desde la BD.
