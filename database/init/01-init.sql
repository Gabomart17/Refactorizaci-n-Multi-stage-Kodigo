-- MySQL ejecuta esto SOLO la primera vez (cuando el volumen está vacío).
-- La base y el usuario ya los crean las variables MYSQL_DATABASE/MYSQL_USER.
-- Acá va lo extra: charset, datos semilla, etc.
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
