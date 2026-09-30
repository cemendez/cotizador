# syntax=docker/dockerfile:1

ARG NODE_VERSION=24
ARG PNPM_VERSION=12.6.0

# ---------- base: Node + pnpm ----------
FROM node:${NODE_VERSION}-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# ---------- deps: todas las dependencias (con las de desarrollo) ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter api

# ---------- build: genera el cliente de Prisma y compila ----------
FROM deps AS build
COPY apps/api apps/api
# DATABASE_URL de mentira: prisma.config.ts la lee, pero generate no se conecta a nada
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# ---------- migrate: aplica migraciones y termina ----------
FROM build AS migrate
# El motor de migraciones de Prisma necesita OpenSSL, que la imagen slim no trae
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/apps/api
CMD ["pnpm", "prisma", "migrate", "deploy"]

# ---------- prod-deps: solo dependencias de producción ----------
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter api

# ---------- api: imagen final ----------
FROM node:${NODE_VERSION}-slim AS api
ENV NODE_ENV=production
WORKDIR /app/apps/api
# Se conserva la misma estructura de carpetas: los symlinks de pnpm son relativos
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]