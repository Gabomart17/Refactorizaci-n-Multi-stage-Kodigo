#!/bin/sh
# Falla de inmediato si algún comando da error
set -e

# Migraciones controladas por variable: no siempre querés correrlas al arrancar
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --force
fi

# Datos de ejemplo (idempotente, ver DatabaseSeeder). Apagalo en producción real.
if [ "$RUN_SEED" = "true" ]; then
  php artisan db:seed --force
fi

# El caché de config se hace AQUÍ (runtime) y no en el build, porque si se cachea
# en el build se "queman" variables de entorno que todavía no existen.
php artisan config:cache
# Funciona porque nuestras rutas usan controlador (con closures, route:cache fallaría)
php artisan route:cache

# Ejecuta el CMD del Dockerfile (supervisord)
exec "$@"
