# 🐳 Ecosistema Dockerizado: Next.js 16 + Laravel 12 + MySQL 8

## Descripción
Catálogo de productos con tres servicios, listo para producción: un **frontend Next.js 16** (App Router)
que consume una **API REST Laravel 12** (PHP 8.2) respaldada por **MySQL 8.0**.
Cada imagen usa builds multi-stage y buenas prácticas de capas para ser liviana, segura y reproducible,
y todo se orquesta con un solo `docker-compose.yml`.

## Estructura
```
docker-ecosystem/
├── docker-compose.yml
├── .env.example
├── database/init/01-init.sql        # script SQL opcional (initdb.d)
├── backend/                         # API Laravel
│   ├── Dockerfile                   # multi-stage: composer -> php-fpm + nginx
│   └── docker/ (nginx.conf, supervisord.conf, entrypoint.sh)
└── frontend/                        # App Next.js
    └── Dockerfile                   # multi-stage: deps -> builder -> runner
```

## Arquitectura

```
 Navegador
    │
    ▼
┌──────────────┐  frontend_net  ┌─────────────────────┐  backend_net  ┌─────────────┐
│  Frontend    │ ─────────────► │  Backend            │ ────────────► │  MySQL 8.0  │
│  Next.js     │                │  Nginx + PHP-FPM    │               │  (3306 sin  │
│  :3000       │                │  :8000              │               │  exponer)   │
└──────────────┘                └─────────────────────┘               └──────┬──────┘
                                                                             │
                                                                     volumen mysql_data
```

- **Dos redes**: el frontend no tiene acceso directo a la base de datos.
- **Healthchecks + depends_on**: el orden de arranque es db → backend → frontend.
- El navegador llama a la API en `http://localhost:8000/api` (CORS habilitado para `localhost:3000`).

## Cómo ejecutarlo
```bash
git clone <url-del-repo> && cd docker-ecosystem
cp .env.example .env     # editá las contraseñas
echo "base64:$(openssl rand -base64 32)"   # pegá el resultado en APP_KEY dentro de .env
docker compose up -d --build
```
- Frontend: http://localhost:3000
- API: http://localhost:8000/api/products
- Health de la API: http://localhost:8000/up

Para apagar: `docker compose down` (con `-v` también borra los datos de MySQL).

## API
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Lista productos |
| POST | `/api/products` | Crea (`name`, `price`, `stock`, `description?`) |
| GET | `/api/products/{id}` | Detalle |
| PUT/PATCH | `/api/products/{id}` | Actualiza |
| DELETE | `/api/products/{id}` | Elimina |

## Decisiones técnicas

### Frontend (Next.js)
- 3 stages (deps → builder → runner) para que la imagen final no tenga código fuente ni devDependencies.
- `output: "standalone"` copia solo lo necesario para correr; `server.js` es el equivalente optimizado de `next start`.
- Los manifests (`package*.json`) se copian antes que el código para aprovechar el caché de capas, y `npm ci` usa caché de BuildKit.
- `NEXT_PUBLIC_API_URL` entra como `ARG` de build porque Next la incrusta en el bundle.
- Sin `next/font/google`: así el build no depende de internet y es reproducible.
- La lista de productos se pide desde el cliente porque durante `next build` el backend no existe.
- Usuario no-root (`nextjs`) y `HEALTHCHECK`.

### Backend (Laravel)
- Stage 1 instala Composer con `--no-dev` y autoloader optimizado; a la imagen final solo pasa `vendor/`.
- PHP-FPM + Nginx en un contenedor, manejados con Supervisor.
- Extensiones: mbstring, openssl, tokenizer, xml, ctype y json ya vienen en la imagen oficial `php:8.2`; solo se instala `pdo_mysql` y `opcache`.
- El caché de config/rutas se genera en runtime (entrypoint) para no quemar variables de entorno en la imagen.
- Las rutas usan controlador (no closures) para poder usar `route:cache`.
- Nginx solo expone `/public` y bloquea archivos ocultos; solo `storage/` y `bootstrap/cache` son escribibles.
- Logs a `stderr` para verlos con `docker compose logs`.

### MySQL
- Imagen oficial `mysql:8.0` configurada solo con variables de entorno.
- Volumen persistente en `/var/lib/mysql`; puerto 3306 no expuesto al host.
- Script SQL opcional montado en `/docker-entrypoint-initdb.d/`.

## Resultados (tamaño de imágenes)
| Imagen | Antes (Dockerfile básico) | Después (multi-stage) |
|--------|---------------------------|-----------------------|
| frontend | _MB_ | _MB_ |
| backend  | _MB_ | _MB_ |
