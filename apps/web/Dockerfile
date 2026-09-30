# syntax=docker/dockerfile:1

ARG NODE_VERSION=24
ARG PNPM_VERSION=12.6.0

FROM node:${NODE_VERSION}-slim AS build
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter web

COPY apps/web apps/web
RUN pnpm --filter web build

# ---------- imagen final: solo archivos estáticos + nginx ----------
FROM nginx:stable-alpine AS web
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80