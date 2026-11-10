# syntax=docker/dockerfile:1
# ^ Activa BuildKit con sintaxis moderna (necesario para --mount=type=cache)

# ==========================================================
# STAGE 1: deps  -> instala dependencias
# ==========================================================
FROM node:20-alpine AS deps
# libc6-compat: algunos paquetes nativos de Node esperan glibc y Alpine usa musl
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiamos SOLO los manifests primero. Mientras no cambies package*.json,
# Docker reutiliza esta capa desde caché y no reinstala todo en cada build.
COPY package.json package-lock.json ./

# npm ci = instalación reproducible exacta desde el lockfile (mejor que npm install en CI/prod)
# --mount=type=cache guarda el caché de npm entre builds para que sea más rápido
RUN --mount=type=cache,target=/root/.npm npm ci

# ==========================================================
# STAGE 2: builder -> compila la app
# ==========================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Traemos node_modules de la etapa anterior (ya cacheada)
COPY --from=deps /app/node_modules ./node_modules
# Ahora sí copiamos el código (lo que más cambia va de último para aprovechar caché)
COPY . .

# OJO: las variables NEXT_PUBLIC_* se "queman" en el JS durante el build,
# no se leen en runtime. Por eso entran como ARG y no solo como env del compose.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ==========================================================
# STAGE 3: runner -> imagen final (liviana y segura)
# ==========================================================
FROM node:20-alpine AS runner
WORKDIR /app

# HOSTNAME=0.0.0.0 es clave: sin eso Next solo escucha en localhost
# dentro del contenedor y no podrías accederlo desde afuera.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Usuario sin privilegios: si alguien explota la app, no es root dentro del contenedor
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# Solo copiamos lo necesario para correr (sin código fuente, sin devDependencies)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Docker marca el contenedor como "healthy" solo si la app responde
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ > /dev/null || exit 1

# server.js (de standalone) es el equivalente optimizado de `next start`
CMD ["node", "server.js"]
