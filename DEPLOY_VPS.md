# Manual de Despliegue en VPS (Docker) - Medical System

Este documento detalla la arquitectura contenerizada y los comandos operativos para desplegar y mantener **Medical System** en el servidor VPS de producción/staging (`74.208.149.57`).

---

## 1. Arquitectura de Contenedores y Asignación de Puertos

Para convivir armónicamente con los proyectos existentes en el servidor (`al-chile`, `sansah`, `notaria`, `nutriker`, `edunem`, etc.), el ecosistema utiliza puertos dedicados y una red bridge aislada (`medical_network`):

| Servicio | Contenedor | Imagen Base | Puerto en Contenedor | Puerto Host (VPS) | Persistencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Base de Datos** | `medical_postgres` | `postgres:16-alpine` | `5432` | **`5438`** | Volumen `medical_postgres_data` |
| **API Backend** | `medical_backend` | `node:20-alpine` | `4000` | **`3014`** | Volumen `medical_uploads_data` (`/app/uploads`) |
| **Frontend Web** | `medical_frontend` | `nginx:alpine` | `80` | **`9193`** | N/A (Build estático de Vite) |

> **Nota Crítica de Aislamiento:** Nginx del sistema host ya administra los puertos `80` y `443`. Los contenedores de Medical System nunca deben intentar vincularse a los puertos 80/443 del host.

---

## 2. Variables de Entorno (`.env`)

En la raíz del proyecto en el VPS, generar el archivo `.env` basado en `.env.example`:

```bash
# Base de Datos PostgreSQL
POSTGRES_USER=medical_user
POSTGRES_PASSWORD=medical_secure_password_2026
POSTGRES_DB=medical_db

# Puertos Dedicados del Host
POSTGRES_PORT=5438
BACKEND_PORT=3014
FRONTEND_PORT=9193

# Seguridad y JWT
JWT_SECRET=medical_super_secret_jwt_key_staging_2026
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

---

## 3. Despliegue Inicial Paso a Paso

1. **Clonar el repositorio en el directorio aislado:**
   ```bash
   cd /root
   git clone https://github.com/DmnCrtSWL/medical-system.git
   cd /root/medical-system
   ```

2. **Crear el archivo de configuración:**
   ```bash
   cp .env.example .env
   ```

3. **Construir y levantar los contenedores:**
   ```bash
   docker compose up --build -d
   ```

4. **Verificar el estado de los servicios:**
   ```bash
   docker compose ps
   ```
   *Los 3 contenedores deben figurar en estado `Up` y `medical_postgres` en `(healthy)`.*

5. **Revisar logs de inicialización y seed:**
   ```bash
   docker compose logs -f backend
   ```
   *El backend aplica automáticamente `prisma db push`, corre el script de `seed` y levanta la API en el puerto 4000.*

---

## 4. Validación de Salud (Health Checks)

Comprobar desde la consola del servidor:
```bash
# Health check directo del backend:
curl -i http://localhost:3014/api/health

# Health check a través del proxy inverso de Nginx en frontend:
curl -i http://localhost:9193/api/health
```

Ambos deben responder `HTTP/1.1 200 OK` con:
```json
{"status":"OK","message":"Medical System Backend API is healthy"}
```

Acceso web desde el navegador:
* **URL:** `http://74.208.149.57:9193`
* **Admin Inicial:** `admin@medical.com` / `Admin123!`

---

## 5. Comandos Operativos de Mantenimiento

* **Ver logs en tiempo real:**
  ```bash
  docker compose logs -f backend
  docker compose logs -f frontend
  ```
* **Reiniciar un servicio específico:**
  ```bash
  docker compose restart backend
  ```
* **Actualizar el sistema con los últimos cambios de Git:**
  ```bash
  git pull origin master
  docker compose up --build -d
  ```
* **Detener los servicios de Medical System sin afectar otros proyectos:**
  ```bash
  docker compose down
  ```
  *(Los volúmenes `medical_postgres_data` y `medical_uploads_data` preservan los datos).*

---

## 6. Configuración Opcional de Dominio con Host Nginx (SSL)

Si se desea asociar un subdominio (ej. `medsys.tudominio.com`), añadir el siguiente bloque en `/etc/nginx/sites-available/medsys`:

```nginx
server {
    server_name medsys.tudominio.com;

    client_max_body_size 3M;

    location / {
        proxy_pass http://127.0.0.1:9193;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Y emitir el certificado con Certbot:
```bash
certbot --nginx -d medsys.tudominio.com
```
