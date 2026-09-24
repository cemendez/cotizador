# Cotizador

Gestor de clientes y cotizaciones para freelancers. Permite administrar clientes, crear cotizaciones con conceptos y montos detallados, controlar el estado de cada una y generar un contrato en PDF a partir de las cotizaciones aceptadas.

Proyecto construido como práctica y portafolio del stack **NestJS + React con TypeScript**.

---

## Tabla de contenido

- [Funcionalidades](#funcionalidades)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Comandos](#comandos)
- [API](#api)
- [Autenticación](#autenticación)
- [Pruebas manuales con Bruno](#pruebas-manuales-con-bruno)
- [Decisiones técnicas](#decisiones-técnicas)
- [Solución de problemas](#solución-de-problemas)
- [Despliegue](#despliegue)
- [Roadmap](#roadmap)

---

## Funcionalidades

- [x] Registro e inicio de sesión con JWT y refresh token rotativo
- [x] CRUD de clientes con paginación, búsqueda y validación de RFC
- [x] Aislamiento de datos por usuario (cada usuario solo ve lo suyo)
- [ ] Cotizaciones con conceptos, subtotal, IVA y total
- [ ] Folio consecutivo por usuario (`COT-2026-0001`)
- [ ] Flujo de estados: borrador → enviada → aceptada / rechazada / vencida
- [ ] Generación de contrato en PDF para cotizaciones aceptadas
- [ ] Frontend en React
- [ ] Tests automatizados
- [ ] Docker completo y despliegue continuo

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 24 LTS |
| Gestor de paquetes | pnpm (workspaces) |
| Backend | NestJS 12 (ESM) |
| ORM | Prisma 7 con `@prisma/adapter-pg` |
| Base de datos | PostgreSQL 17 (Docker) |
| Autenticación | `@nestjs/jwt`, `@node-rs/argon2`, cookies httpOnly |
| Validación | `class-validator` + `class-transformer` |
| Frontend | React + Vite + TypeScript |
| Tests | Vitest + Supertest |
| Linter | oxlint |

---

## Arquitectura

Monorepo con pnpm workspaces. La base de datos corre en Docker; la API y el frontend corren de forma nativa durante el desarrollo para tener recarga en caliente rápida.

```
cotizador/
├── apps/
│   ├── api/                      # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Modelo de datos
│   │   │   └── migrations/       # Historial de migraciones
│   │   ├── prisma.config.ts      # Configuración de Prisma 7
│   │   ├── src/
│   │   │   ├── auth/             # Registro, login, JWT, guard global
│   │   │   ├── clients/          # CRUD de clientes
│   │   │   ├── common/           # Decoradores y utilidades compartidas
│   │   │   ├── prisma/           # PrismaService (módulo global)
│   │   │   ├── generated/        # Cliente de Prisma generado (no se versiona)
│   │   │   ├── health.controller.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── .env.example
│   └── web/                      # Frontend React + Vite
├── docker-compose.yml            # PostgreSQL
├── pnpm-workspace.yaml
└── package.json                  # Scripts globales
```

---

## Modelo de datos

```
User ──< Client ──< Quote ──< QuoteItem
  └────────────────────┘  (cada cotización también pertenece al usuario)
User ──< RefreshToken
```

- **User**: cuenta del freelancer (datos fiscales opcionales para el PDF).
- **RefreshToken**: sesiones activas; se guarda solo el hash SHA-256 del token.
- **Client**: clientes del usuario. No se puede eliminar si tiene cotizaciones.
- **Quote**: cotización con folio, estado, moneda, tasa de IVA y totales.
- **QuoteItem**: conceptos de la cotización (descripción, unidad, cantidad, precio unitario).

Los montos se guardan como `Decimal(12,2)`, nunca como `float`.

---

## Requisitos

- [Node.js 24 LTS](https://nodejs.org)
- pnpm: `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (en Windows, con backend WSL2)
- Git

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/cemendez/cotizador.git cotizador
cd cotizador

# 2. Instalar dependencias de todo el monorepo
pnpm install

# 3. Crear el archivo de entorno de la API
cp apps/api/.env.example apps/api/.env
# Edita apps/api/.env y genera un secreto para JWT_ACCESS_SECRET:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Levantar PostgreSQL
pnpm db:up

# 5. Aplicar migraciones y generar el cliente de Prisma
pnpm db:migrate
pnpm db:generate

# 6. Arrancar la API y el frontend (en terminales separadas)
pnpm dev:api
pnpm dev:web
```

Verifica que todo funcione:

- API: <http://localhost:3000/api/health> → `{"status":"ok","db":"connected"}`
- Frontend: <http://localhost:5173>

---

## Variables de entorno

Archivo `apps/api/.env`:

| Variable | Ejemplo | Descripción |
|---|---|---|
| `DATABASE_URL` | `postgresql://cotizador:cotizador@localhost:5434/cotizador` | Conexión a PostgreSQL (puerto 5434 en el host) |
| `PORT` | `3000` | Puerto de la API |
| `WEB_ORIGIN` | `http://localhost:5173` | Origen permitido por CORS |
| `NODE_ENV` | `development` | En `production` las cookies se marcan como `secure` |
| `JWT_ACCESS_SECRET` | *(64 bytes hex)* | Secreto para firmar los access tokens |
| `JWT_ACCESS_TTL_SECONDS` | `900` | Vida del access token (15 min) |
| `REFRESH_TTL_DAYS` | `7` | Vida del refresh token |

> El archivo `.env` nunca se sube al repositorio. Solo `.env.example`.

---

## Comandos

Todos se ejecutan desde la raíz del proyecto.

### Desarrollo

| Comando | Descripción |
|---|---|
| `pnpm dev:api` | API en modo watch → <http://localhost:3000/api> |
| `pnpm dev:web` | Frontend con Vite → <http://localhost:5173> |

### Base de datos

| Comando | Descripción |
|---|---|
| `pnpm db:up` | Levanta PostgreSQL en Docker |
| `pnpm db:down` | Detiene el contenedor (los datos se conservan en el volumen) |
| `pnpm db:migrate --name <nombre>` | Crea y aplica una migración tras cambiar el schema |
| `pnpm db:generate` | Regenera el cliente de Prisma (obligatorio después de cada migración) |
| `pnpm db:studio` | Abre Prisma Studio para explorar los datos → <http://localhost:5555> |
| `pnpm db:reset` | ⚠️ Borra la base, reaplica todas las migraciones |

> En Prisma 7, `migrate dev` ya **no** ejecuta `generate` automáticamente. Después de cada migración corre `pnpm db:generate`.

### Flujo al modificar el modelo de datos

```bash
# 1. Editar apps/api/prisma/schema.prisma
# 2. Crear y aplicar la migración
pnpm db:migrate --name descripcion_del_cambio
# 3. Regenerar el cliente
pnpm db:generate
```

---

## API

Prefijo global: `/api`. Todas las rutas requieren `Authorization: Bearer <accessToken>` excepto las marcadas como públicas.

### Health

| Método | Ruta | Pública | Descripción |
|---|---|---|---|
| GET | `/health` | ✅ | Estado de la API y de la conexión a la base |

### Autenticación

| Método | Ruta | Pública | Descripción |
|---|---|---|---|
| POST | `/auth/register` | ✅ | Crea la cuenta; devuelve `user` + `accessToken` y la cookie `refresh_token` |
| POST | `/auth/login` | ✅ | Inicia sesión; misma respuesta que register |
| POST | `/auth/refresh` | ✅ | Usa la cookie para emitir un nuevo `accessToken` y rotar el refresh token |
| POST | `/auth/logout` | ✅ | Revoca el refresh token y borra la cookie |
| GET | `/auth/me` | | Datos del usuario autenticado |

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/clients?page=1&pageSize=20&search=texto` | Lista paginada con búsqueda por nombre, empresa, correo o RFC |
| GET | `/clients/:id` | Detalle (incluye número de cotizaciones) |
| POST | `/clients` | Crear cliente |
| PATCH | `/clients/:id` | Actualización parcial (enviar `null` para borrar un campo opcional) |
| DELETE | `/clients/:id` | Eliminar (409 si tiene cotizaciones) |

Respuesta paginada:

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
}
```

---

## Autenticación

- **Access token**: JWT de 15 minutos. El frontend lo mantiene en memoria y lo envía en el header `Authorization`.
- **Refresh token**: valor aleatorio de 7 días enviado en una cookie `httpOnly` limitada a `/api/auth`. En la base se guarda solo su hash.
- **Rotación**: cada refresh revoca el token usado y emite uno nuevo.
- **Detección de reuso**: si se presenta un refresh token ya revocado, se cierran todas las sesiones del usuario.
- **Protegido por defecto**: un guard global exige token en todas las rutas; las excepciones usan el decorador `@Public()`.
- **Usuario actual**: disponible en cualquier controlador con `@CurrentUser()`.

---

## Pruebas manuales con Bruno

1. Crear un environment `local` con:
   - `baseUrl` = `http://localhost:3000/api`
   - `accessToken` = *(vacío)*
2. En la configuración de la colección, pestaña **Auth** → **Bearer Token** → `{{accessToken}}`. Cada petición en **Inherit**.
3. En register, login y refresh, pestaña **Script → Post Response**:

   ```js
   if (res.body && res.body.accessToken) {
     bru.setEnvVar("accessToken", res.body.accessToken);
   }
   ```

4. La cookie `refresh_token` se guarda automáticamente (panel **Cookies**). Para depurar, revisar la pestaña **Timeline** de cada petición.

Secuencia básica: `login → me → refresh → me → logout → refresh (401)`.

---

## Decisiones técnicas

- **NestJS 12 en modo ESM**: es el nuevo default del framework. Todos los imports relativos llevan extensión `.js`.
- **Prisma 7 y no Prisma 8**: Prisma 8 cambia por completo el flujo (contracts, `migration plan`). Se fijó la versión 7, que sigue con soporte completo y es la más usada en proyectos existentes.
- **Guard propio sin Passport**: menos dependencias y flujo de autenticación explícito.
- **Refresh token opaco en cookie httpOnly**: no es accesible desde JavaScript (protección contra XSS) y puede revocarse desde la base.
- **404 en lugar de 403** al pedir recursos de otro usuario, para no revelar qué IDs existen.
- **Totales guardados en la cotización** y recalculados en transacción al modificar conceptos, para poder listar y ordenar por monto sin recalcular.
- **PDF generado en el backend** sin navegador headless.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Cannot find module './algo'` | Import relativo sin `.js` (ESM) | Usar `./algo.js` |
| `TS1272` en un controlador | Tipo usado en parámetro decorado sin `import type` | `import type { Request } from 'express'` |
| `Cannot POST /api/...` (404) | Errores de compilación o módulo no registrado | Revisar la terminal y el log `Mapped {...}` al arrancar |
| `No command registered for migrate` | Se instaló Prisma 8 | `pnpm add -D prisma@7` y `pnpm add @prisma/client@7 @prisma/adapter-pg@7` |
| Propiedad no existe en el cliente de Prisma | Cliente sin regenerar | `pnpm db:generate` |
| Error de conexión a la base | Contenedor apagado o puerto distinto | `pnpm db:up` y revisar `docker ps` (debe mostrar `5434->5432`) |
| `401 Sesión inválida` en refresh | Se reusó un refresh token rotado | Iniciar sesión de nuevo |

---

## Despliegue

*Pendiente.* Esta sección documentará:

- Dockerfile de la API
- Hosting del frontend y de la API
- Base de datos en la nube
- Variables de entorno de producción
- Pipeline de CI/CD con GitHub Actions

---

## Roadmap

1. ~~Cimientos: monorepo, Docker, NestJS, Prisma~~
2. ~~Autenticación~~
3. ~~CRUD de clientes~~
4. Módulo de cotizaciones (conceptos, totales, folios, estados)
5. Generación de contrato en PDF
6. Frontend: login, clientes y cotizaciones
7. Tests e2e de la API
8. Dockerización completa
9. CI/CD y despliegue

---

**Autor:** Carlos — [carlosemendez.com](https://carlosemendez.com)