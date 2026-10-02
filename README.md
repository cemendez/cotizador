# Cotizador

Gestor de clientes y cotizaciones para freelancers. Permite administrar clientes, crear cotizaciones con conceptos y montos detallados, controlar el estado de cada una y generar la cotización y un contrato de prestación de servicios en PDF.

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
- [Frontend](#frontend)
- [Autenticación](#autenticación)
- [Pruebas](#pruebas)
- [Decisiones técnicas](#decisiones-técnicas)
- [Solución de problemas](#solución-de-problemas)
- [Despliegue](#despliegue)
- [Roadmap](#roadmap)

---

## Funcionalidades

**Backend**

- [x] Registro e inicio de sesión con JWT y refresh token rotativo con detección de reuso
- [x] CRUD de clientes con paginación, búsqueda y validación de RFC
- [x] Aislamiento de datos por usuario (cada usuario solo ve lo suyo)
- [x] Cotizaciones con conceptos, subtotal, IVA y total con aritmética decimal exacta
- [x] Folio consecutivo por usuario (`COT-2026-0001`) sin colisiones
- [x] Máquina de estados: borrador → enviada → aceptada / rechazada / vencida
- [x] Cotización en PDF (con marca de agua en borradores) y contrato en PDF para aceptadas
- [x] Dashboard con monto aceptado del mes, pendiente de respuesta y cotizaciones por vencer
- [x] Perfil del emisor y cambio de contraseña con cierre de todas las sesiones

**Frontend**

- [x] Sesión persistente con refresh automático y transparente
- [x] Rutas protegidas con regreso a la página de origen tras iniciar sesión
- [x] Listas con búsqueda, filtros y paginación guardados en la URL
- [x] Editor de cotizaciones con conceptos dinámicos y totales en vivo
- [x] Cambios de estado con confirmación y apertura de PDFs protegidos
- [x] Dashboard y pantalla de perfil
- [x] Aviso cuando el servidor tarda en responder
- [x] Selector de clientes con búsqueda

**Pendiente**

- [x] Tests e2e de la API
- [x] Docker completo
- [x] CI/CD y despliegue

---

## Stack tecnológico

### Backend

| Área | Tecnología |
|---|---|
| Runtime | Node.js 24 LTS |
| Framework | NestJS 12 (ESM) |
| ORM | Prisma 7 con `@prisma/adapter-pg` |
| Base de datos | PostgreSQL 17 (Docker) |
| Autenticación | `@nestjs/jwt`, `@node-rs/argon2`, cookies httpOnly |
| Validación | `class-validator` + `class-transformer` |
| PDF | pdfmake 0.3 |
| Tests | Vitest |
| Linter | oxlint |

### Frontend

| Área | Tecnología |
|---|---|
| Build | Vite 8 + TypeScript 6 |
| UI | React 19 |
| Rutas | React Router 8 (modo declarativo) |
| Datos del servidor | TanStack Query 5 |
| Formularios | react-hook-form 7 + Zod 4 |
| Estilos | Tailwind CSS 4 |

### Herramientas

| Área | Tecnología |
|---|---|
| Monorepo | pnpm workspaces |
| Pruebas manuales de la API | Bruno |

---

## Arquitectura

Monorepo con pnpm workspaces. La base de datos corre en Docker; la API y el frontend corren de forma nativa durante el desarrollo. En desarrollo, Vite reenvía las peticiones `/api` a NestJS, así el frontend y la API comparten origen.

```
cotizador/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── prisma.config.ts
│   │   ├── src/
│   │   │   ├── auth/                 # Registro, login, JWT, guard global
│   │   │   ├── users/                # Perfil y cambio de contraseña
│   │   │   ├── clients/              # CRUD de clientes
│   │   │   ├── quotes/               # Cotizaciones, cálculo, estados, PDF
│   │   │   ├── dashboard/            # Resumen de actividad
│   │   │   ├── pdf/                  # Servicio genérico de generación de PDF
│   │   │   ├── common/
│   │   │   │   ├── decorators/       # @Trim()
│   │   │   │   ├── dto/              # Paginación reutilizable
│   │   │   │   ├── utils/            # Fechas en zona horaria de México
│   │   │   │   └── validation/       # Expresiones compartidas (RFC)
│   │   │   ├── prisma/               # PrismaService (módulo global)
│   │   │   ├── generated/            # Cliente de Prisma (no se versiona)
│   │   │   ├── health.controller.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── .env.example
│   └── web/                          # Frontend React
│       ├── vite.config.ts            # Proxy /api → NestJS
│       └── src/
│           ├── auth/                 # Contexto de sesión y rutas protegidas
│           ├── components/           # Layout y componentes de UI
│           ├── features/
│           │   ├── clients/
│           │   ├── quotes/
│           │   ├── dashboard/
│           │   └── profile/
│           ├── lib/                  # Cliente HTTP, QueryClient, formatos
│           ├── pages/                # Login y registro
│           └── types/                # Tipos de las respuestas de la API
├── bruno/                            # Colección de pruebas manuales (opcional)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

Cada módulo del frontend (`features/*`) tiene un archivo `api.ts` con sus consultas y mutaciones de TanStack Query. Los componentes nunca llaman al cliente HTTP directamente.

---

## Modelo de datos

```
User ──< Client ──< Quote ──< QuoteItem
  └────────────────────┘  (cada cotización también pertenece al usuario)
User ──< RefreshToken
```

- **User**: cuenta del freelancer. Guarda sus datos de emisor (razón social, RFC) y el contador `lastQuoteNumber` para los folios.
- **RefreshToken**: sesiones activas; se guarda solo el hash SHA-256 del token.
- **Client**: clientes del usuario. No se puede eliminar si tiene cotizaciones.
- **Quote**: cotización con folio, estado, moneda, tasa de IVA, totales, vigencia y fechas de envío y aceptación.
- **QuoteItem**: conceptos (descripción, unidad, cantidad, precio unitario e importe).

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
git clone <url-del-repositorio> cotizador
cd cotizador

# 2. Instalar dependencias de todo el monorepo
pnpm install

# 3. Crear el archivo de entorno de la API
cp apps/api/.env.example apps/api/.env
# Generar un secreto para JWT_ACCESS_SECRET:
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
- Frontend: <http://localhost:5173> → pantalla de inicio de sesión

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

El frontend no necesita variables en desarrollo. `VITE_API_URL` es opcional y por defecto vale `/api`.

> El archivo `.env` nunca se sube al repositorio. Solo `.env.example`.

---

## Comandos

Todos se ejecutan desde la raíz del proyecto.

### Desarrollo

| Comando | Descripción |
|---|---|
| `pnpm dev:api` | API en modo watch → <http://localhost:3000/api> |
| `pnpm dev:web` | Frontend con Vite → <http://localhost:5173> |
| `pnpm test:api` | Tests de la API (una sola ejecución) |

### Base de datos

| Comando | Descripción |
|---|---|
| `pnpm db:up` | Levanta PostgreSQL en Docker |
| `pnpm db:down` | Detiene el contenedor (los datos se conservan en el volumen) |
| `pnpm db:migrate --name <nombre>` | Crea y aplica una migración tras cambiar el schema |
| `pnpm db:generate` | Regenera el cliente de Prisma (obligatorio después de cada migración) |
| `pnpm db:studio` | Abre Prisma Studio → <http://localhost:5555> |
| `pnpm db:reset` | ⚠️ Borra la base y reaplica todas las migraciones |

> En Prisma 7, `migrate dev` ya **no** ejecuta `generate` automáticamente.

## Docker

| Comando | Descripción |
|---------|-------------|
| `pnpm docker:dev` | Levanta API y Frontend en contenedores → <http://localhost:5173> |
| `pnpm docker:api` | Solo API en contenedor → <http://localhost:3000/api> |
| `pnpm docker:web` | Solo Frontend en contenedor → <http://localhost:5173> |
| `pnpm docker:down` | Detiene todos los contenedores |

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

Prefijo global: `/api`. Todas las rutas requieren `Authorization: Bearer <accessToken>` excepto las marcadas como públicas. Los montos se devuelven como **strings** para no perder precisión.

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

### Perfil

| Método | Ruta | Descripción |
|---|---|---|
| PATCH | `/users/me` | Actualiza nombre, razón social y RFC |
| PATCH | `/users/me/password` | Cambia la contraseña y revoca todas las sesiones (400 si la actual es incorrecta) |

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/clients?page=1&pageSize=20&search=texto` | Lista paginada con búsqueda por nombre, empresa, correo o RFC |
| GET | `/clients/:id` | Detalle (incluye número de cotizaciones) |
| POST | `/clients` | Crear cliente |
| PATCH | `/clients/:id` | Actualización parcial (enviar `null` para borrar un campo opcional) |
| DELETE | `/clients/:id` | Eliminar (409 si tiene cotizaciones) |

### Cotizaciones

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/quotes?page=1&status=SENT&clientId=...&search=texto` | Lista paginada con filtros |
| GET | `/quotes/:id` | Detalle con conceptos y folio |
| POST | `/quotes` | Crear con sus conceptos; calcula totales y asigna folio |
| PATCH | `/quotes/:id` | Editar (solo `DRAFT`); si se envían `items`, reemplazan a los anteriores |
| PATCH | `/quotes/:id/status` | Cambiar estado según las transiciones permitidas |
| DELETE | `/quotes/:id` | Eliminar (solo `DRAFT`) |
| GET | `/quotes/:id/pdf` | Cotización en PDF |
| GET | `/quotes/:id/contract` | Contrato en PDF (solo `ACCEPTED`) |

Transiciones de estado:

| Desde | Puede pasar a |
|---|---|
| `DRAFT` | `SENT` |
| `SENT` | `ACCEPTED`, `REJECTED`, `EXPIRED`, `DRAFT` |
| `ACCEPTED`, `REJECTED`, `EXPIRED` | Estados finales |

### Dashboard

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard` | Conteo por estado, monto aceptado del mes y pendiente (por moneda), por vencer en 7 días y actividad reciente |

### Formato de respuestas paginadas

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
}
```

---

## Frontend

| Ruta | Pantalla |
|---|---|
| `/login`, `/register` | Acceso (solo visitantes) |
| `/` | Dashboard |
| `/clients` | Lista de clientes |
| `/clients/new`, `/clients/:id/edit` | Alta y edición de cliente |
| `/quotes` | Lista de cotizaciones con filtro por estado |
| `/quotes/new` | Nueva cotización (acepta `?clientId=` para preseleccionar) |
| `/quotes/:id` | Detalle, cambios de estado y PDFs |
| `/quotes/:id/edit` | Edición (solo borradores) |
| `/profile` | Datos del emisor y cambio de contraseña |

Puntos clave:

- **Estado del servidor** con TanStack Query y claves jerárquicas (`['clients', 'list', {...}]`). Crear, editar o borrar invalida todo lo que empieza con `['clients']`.
- **Estado de sesión** en un contexto de React; el access token vive en memoria, nunca en `localStorage`.
- **Filtros y paginación en la URL**: sobreviven a recargas y el botón "atrás" funciona como se espera.
- **PDFs protegidos**: se descargan con `fetch` (para enviar el token) y se abren como Blob en una pestaña nueva.

---

## Autenticación

**Backend**

- **Access token**: JWT de 15 minutos enviado en el header `Authorization`.
- **Refresh token**: valor aleatorio de 7 días en una cookie `httpOnly` limitada a `/api/auth`. En la base se guarda solo su hash.
- **Rotación**: cada refresh revoca el token usado y emite uno nuevo, con revocación atómica para peticiones simultáneas.
- **Detección de reuso**: si se presenta un refresh token ya revocado, se cierran todas las sesiones del usuario.
- **Protegido por defecto**: un guard global exige token en todas las rutas; las excepciones usan `@Public()`.
- **Usuario actual**: disponible en cualquier controlador con `@CurrentUser()`.

**Frontend**

- Al cargar la app se intenta recuperar la sesión con la cookie.
- Si una petición recibe 401, se hace refresh y se repite la petición original sin que el usuario lo note.
- Todas las peticiones que necesiten refresh al mismo tiempo comparten **una sola promesa**, para no disparar la detección de reuso (importante con React StrictMode).
- Las rutas protegidas recuerdan la página de origen en el `state` del historial, no en la URL, para evitar redirecciones abiertas.

---

## Pruebas

### Tests automatizados

```bash
pnpm test:api
```

- `quote-calculator.spec.ts`: importes, IVA, redondeo y errores de punto flotante.
- `mx-dates.spec.ts`: rangos de mes y fechas en zona horaria de México.

### Pruebas manuales con Bruno

1. Environment `local` con:
   - `baseUrl` = `http://localhost:3000/api`
   - `accessToken`, `clientId`, `quoteId` = *(vacíos; los llenan los scripts)*
2. Colección → **Auth** → **Bearer Token** → `{{accessToken}}`. Cada petición en **Inherit**.
3. Scripts **Post Response**:

   ```js
   // register, login, refresh
   if (res.body && res.body.accessToken) {
     bru.setEnvVar("accessToken", res.body.accessToken, { persist: true });
   }

   // POST /clients
   if (res.body && res.body.id) bru.setEnvVar("clientId", res.body.id, { persist: true });

   // POST /quotes
   if (res.body && res.body.id) bru.setEnvVar("quoteId", res.body.id, { persist: true });
   ```

4. La cookie `refresh_token` se guarda automáticamente. Para depurar, revisar la pestaña **Timeline**.

---

## Decisiones técnicas

**Backend**

- **NestJS 12 en modo ESM**: es el nuevo default del framework. Los imports relativos llevan extensión `.js`.
- **Prisma 7 y no Prisma 8**: Prisma 8 cambia por completo el flujo (contracts, `migration plan`). Se fijó la versión 7, que sigue con soporte y es la más usada en proyectos existentes.
- **Guard propio sin Passport**: menos dependencias y flujo de autenticación explícito.
- **Refresh token opaco en cookie httpOnly**: no es accesible desde JavaScript y puede revocarse desde la base.
- **404 en lugar de 403** al pedir recursos de otro usuario, para no revelar qué IDs existen.
- **Validación de propiedad en relaciones**: al crear una cotización se verifica que el cliente pertenezca al usuario.
- **Cálculo en una función pura** (`quote-calculator.ts`) con `Prisma.Decimal`, probada con tests unitarios.
- **Folio con contador atómico** en el usuario, incrementado dentro de la transacción de creación.
- **Máquina de estados declarativa** (tabla de transiciones) y cambios de estado condicionados al estado actual para evitar condiciones de carrera.
- **Totales guardados en la cotización** y recalculados al modificar conceptos, para listar y ordenar sin recalcular.
- **PDF con pdfmake y fuentes estándar**: sin archivos de fuente ni navegador headless. Las URLs externas están bloqueadas para prevenir SSRF.
- **Zona horaria de México** para "este mes" y "hoy"; las fechas de solo día (vigencia) se guardan y formatean en UTC para no desfasarse un día.
- **400 y no 401** cuando la contraseña actual es incorrecta, para no activar el refresh del frontend.

**Frontend**

- **Proxy de Vite**: el frontend llama a `/api` en su propio origen; la cookie es del mismo sitio y no hay CORS.
- **Access token en memoria** y refresh con promesa compartida.
- **Una sola responsable de redirigir** tras el login (`GuestOnly`), para evitar condiciones de carrera entre redirecciones.
- **Totales en vivo con centavos enteros**, replicando el redondeo del backend, que sigue siendo la fuente de verdad.
- **`<dialog>` nativo** para confirmaciones: accesible por defecto (Esc, foco, fondo).

### Docker

- Migraciones como contenedor de un solo uso, separado de la API.
- nginx como único punto de entrada, con proxy a la API.
- Imágenes multi-etapa sobre Debian slim, con la API ejecutándose sin privilegios.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Cannot find module './algo'` en la API | Import relativo sin `.js` (ESM) | Usar `./algo.js` (en el frontend no aplica) |
| `TS1272` en un controlador | Tipo usado en parámetro decorado sin `import type` | `import type { Request } from 'express'` |
| `Cannot POST /api/...` (404) | Errores de compilación o módulo no registrado | Revisar la terminal y el log `Mapped {...}` al arrancar |
| `No command registered for migrate` | Se instaló Prisma 8 | `pnpm add -D prisma@7` y `pnpm add @prisma/client@7 @prisma/adapter-pg@7` |
| Propiedad no existe en el cliente de Prisma | Cliente sin regenerar | `pnpm db:generate` |
| `Cannot find module 'pdfmake/interfaces'` | `nodenext` respeta el campo `exports` de pdfmake | Mapear la ruta con `paths` en `apps/api/tsconfig.json` |
| Falla `app.controller.spec.ts` | Test de ejemplo de NestJS sin su controlador | Borrar el archivo |
| Error de conexión a la base | Contenedor apagado o puerto distinto | `pnpm db:up` y revisar `docker ps` (`5434->5432`) |
| `401 Sesión inválida` en refresh | Se reusó un refresh token rotado | Iniciar sesión de nuevo |
| Import de `react-router-dom` falla | Se eliminó en React Router 8 | Importar desde `react-router` |
| La vigencia se muestra un día antes | Fecha de solo día formateada en hora local | Formatear con `timeZone: 'UTC'` |
| El PDF no abre en pestaña nueva | Bloqueador de pop-ups | La pestaña debe abrirse dentro del clic, antes de esperar la descarga |
| `Access to local file denied by resource access policy: Helvetica` | La política local de pdfmake bloquea también las fuentes estándar | Permitir solo las 4 variantes de Helvetica en `setLocalAccessPolicy` |

---

## Despliegue

```bash
navegador ──► Vercel (frontend estático)
└─ /api/* (rewrite, mismo origen) ──► Render (API en Docker) ──► Neon (PostgreSQL)
```


| Pieza | Servicio | Plan |
|---|---|---|
| Frontend | Vercel | Hobby |
| API | Render (contenedor Docker) | Gratuito |
| Base de datos | Neon (PostgreSQL 17) | Gratuito |

**Despliegue continuo.** Cada fusión a `main` ejecuta el CI y, si pasa, el trabajo `deploy`:
aplica las migraciones en Neon, despliega en Render el commit exacto y espera a que
`/api/health/live` responda con ese commit. Vercel despliega el frontend por su cuenta.

**Arranque en frío.** El plan gratuito de Render duerme la API tras 15 minutos sin tráfico, y
Neon suspende la base a los 5. El primer acceso después de un rato tarda unos 20 segundos.

**Migraciones.** Se aplican antes de desplegar, así que cada una debe ser compatible con la
versión anterior del código (agregar, no renombrar ni borrar en el mismo paso).

**Secretos.** Viven en el Environment `production` de GitHub y en el panel de Render; nunca en el repositorio.

---

## Roadmap

1. ~~Cimientos: monorepo, Docker, NestJS, Prisma~~
2. ~~Autenticación~~
3. ~~CRUD de clientes~~
4. ~~Cotizaciones: conceptos, totales, folios, estados~~
5. ~~Cotización y contrato en PDF~~
6. ~~Frontend: sesión, clientes y cotizaciones~~
7. ~~Dashboard y perfil~~
8. ~~Tests e2e de la API~~
9. ~~Dockerización completa~~
10. ~~CI/CD y despliegue~~

### Mejoras identificadas

- Marcar automáticamente como vencidas las cotizaciones enviadas que pasaron su vigencia (tarea programada).
- Cantidad con letra en el contrato.

---

**Autor:** Carlos — [carlosemendez.com](https://carlosemendez.com)