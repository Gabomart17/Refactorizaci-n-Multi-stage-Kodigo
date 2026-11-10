# syntax=docker/dockerfile:1

# ==========================================================
# STAGE 1: vendor -> instala dependencias de Composer
# ==========================================================
# Usamos php:8.2-cli (misma versión que producción) para que Composer
# valide las dependencias contra el PHP real y no contra otro.
FROM php:8.2-cli-alpine AS vendor

# Composer viene copiado desde su imagen oficial (no hace falta instalarlo a mano)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# unzip y git: Composer los usa para bajar paquetes rápido
RUN apk add --no-cache unzip git

WORKDIR /app

# Solo los manifests primero -> caché de capas si no cambian dependencias
COPY composer.json composer.lock* ./

# --no-dev: sin phpunit, faker, etc. (menos peso y menos superficie de ataque)
# --no-scripts y --no-autoloader: todavía no tenemos el código, se hace después
RUN --mount=type=cache,target=/tmp/composer-cache \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist

# Ahora sí el código, para generar el autoloader optimizado con las clases reales
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

# ==========================================================
# STAGE 2: runtime -> PHP-FPM + Nginx
# ==========================================================
FROM php:8.2-fpm-alpine AS runtime

# nginx: proxy inverso hacia php-fpm | supervisor: mantiene los 2 procesos vivos
# Extensiones: mbstring, openssl, tokenizer, xml, ctype y json YA vienen compiladas
# en la imagen oficial php:8.2, así que solo instalamos pdo_mysql y opcache.
RUN apk add --no-cache nginx supervisor \
    && docker-php-ext-install pdo_mysql opcache \
    # php.ini de producción: oculta errores al cliente y ajusta límites seguros
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# OPcache guarda el bytecode compilado -> la API responde bastante más rápido
RUN { \
      echo 'opcache.enable=1'; \
      echo 'opcache.memory_consumption=128'; \
      echo 'opcache.validate_timestamps=0'; \
    } > /usr/local/etc/php/conf.d/opcache.ini
# validate_timestamps=0: en prod el código no cambia, no hace falta revisar archivos

WORKDIR /var/www/html

# 1) Solo vendor/ viene de la etapa de build (Composer NO queda en la imagen final)
COPY --from=vendor /app/vendor ./vendor
# 2) Después el código de la app (vendor está en .dockerignore, no lo pisa)
COPY . .

# Configs de Nginx, Supervisor y el script de arranque
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Laravel necesita escribir en storage/ y bootstrap/cache. El resto del código
# queda de solo lectura para www-data (si lo hackean, no puede modificar el código).
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p storage/framework/cache storage/framework/sessions \
                storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000

# Usa /up (health route de Laravel 11+). Si tu API no lo tiene, cambialo por una ruta propia.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/up > /dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
