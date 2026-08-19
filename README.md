# Medical Management System

¡Bienvenido al repositorio del Medical Management System, Yael! 🏥👋

Estamos muy contentos de que te unas al equipo. Este sistema es una plataforma B2B enfocada en gestionar y proveer personal médico a corporativos grandes. Funciona como el puente operativo y administrativo entre los doctores y las empresas que contratan nuestro servicio de "Consultorio In-House" para sus empleados.

> **TU PRIMER PASO (URGENTE):**  
> Por favor entra a revisar el **[Mapa del Ecosistema y Cronograma Interactivo](https://medical-system-sable.vercel.app/)** que acabamos de publicar. Es vital que lo leas completo para que entiendas la magnitud del proyecto, cómo fluyen los datos y, sobre todo, para que seas **100% consciente de los tiempos de entrega tan rigurosos** a los que nos hemos comprometido con el cliente.

## 📌 ¿De qué trata el Ecosistema?

El proyecto completo se compone de 5 entornos que "platican" entre sí:

1. **Sistema Administrativo Web (`/admin`):** El panel de control central para nuestro personal interno. **No es para uso clínico**, es puramente operativo.
   - *Funciones:* Gestión de usuarios, alta de clientes B2B, cartera de doctores, generación automática de contratos en PDF, módulo de finanzas/caja, dashboard de reportes y un calendario de vencimientos de contratos.
   
2. **Aplicación Móvil Nativa (`/mobile-native`):** La herramienta de guerra para los **doctores**.
   - *Funciones:* Captura rápida de la historia clínica (diagnósticos, síntomas, tratamientos). Es imperativo que pueda funcionar *offline* (si la planta corporativa no tiene buen internet) y sincronizarse después con el backend.
   
3. **Backend Central (`/backend`):** El "cerebro" y API que recibe, asegura y conecta todos los datos (Node.js, Postgres).
   
4. **Portal del Paciente (`/portal`):** *(Fase posterior)* Interfaz B2C donde el empleado/paciente consulta sus recetas y compra servicios extra.
   
5. **Sitio Explicativo B2B (`/landing`):** Página pública para atraer nuevas empresas corporativas.

## 🛠️ Stack Tecnológico
- **Frontend (Web/Admin):** Vue 3, TailwindCSS, Componentes de interfaz de Shadcn.
- **Backend:** Node.js, Express, PostgreSQL.
- **Móvil:** React Native + Expo (Código base único para iOS y Android).
- **Diseño UI/UX:** Limpieza extrema, mucho espacio "en blanco" para respirar, componentes con radios de borde muy amplios (estilo "redondito" premium) y uso estricto de nuestros colores (Menta `#34D399` y Azul Marino `#0A2540`).

## 📅 Sprints, Milestones y Tablero de GitHub

Hemos estructurado un *Project Board* profesional directamente aquí en GitHub para que programes sin fricción desde el Día 1.
- En la pestaña de **Milestones**, verás las 5 Fases del proyecto con sus fechas límite inamovibles (Iniciando ahora en Agosto y terminando el 11 de Diciembre).
- En la pestaña de **Issues**, encontrarás todas tus tareas técnicas extremadamente granulares y separadas por etiquetas de color (`Frontend`, `Backend`, `Mobile`, `Infra`). Tu trabajo es tomar una Issue, asignártela, y empezar a tirar código.

## 🤝 Flujo de Trabajo
- **Commits y PRs:** Prohibido empujar directo a `master/main`. Todo desarrollo debe ser enviado mediante Pull Requests (PRs). Al crear tu PR, asegúrate de conectarlo a la Issue correspondiente (ej. `Closes #12`) para que la barra de progreso del Milestone avance automáticamente.
- **Regla de Privacidad Máxima:** NUNCA dejes datos financieros reales, contratos, o nombres de clientes verdaderos "hardcodeados" en el código fuente. Todo valor escrito en el frontend debe ser texto de prueba (lorem ipsum o dummy data).

## 🗄️ Base de Datos Local (PostgreSQL)

Para levantar la base de datos de desarrollo local mediante Docker Compose:

1. **Copiar plantilla de variables de entorno:**
   ```bash
   cp .env.example .env
   ```

2. **Levantar el contenedor de PostgreSQL 16:**
   ```bash
   docker compose up -d
   ```

3. **Verificar el estado del contenedor:**
   ```bash
   docker compose ps
   ```

- **Puerto:** `5432`
- **Base de datos:** `medical_system_db`
- **Usuario por defecto:** `postgres`

