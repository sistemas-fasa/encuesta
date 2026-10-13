FROM node:22-alpine AS frontend-build

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM php:8.3-apache

RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite headers deflate \
    && sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
    && printf '\n<Directory /var/www/html/public>\n    AllowOverride All\n    Require all granted\n</Directory>\n' >> /etc/apache2/apache2.conf

RUN printf 'session.cookie_secure=1\nsession.cookie_httponly=1\nsession.cookie_samesite=Lax\nsession.gc_maxlifetime=86400\nupload_max_filesize=8M\npost_max_size=10M\nmemory_limit=256M\n' \
    > /usr/local/etc/php/conf.d/99-encuestas-production.ini

WORKDIR /var/www/html

COPY public/.htaccess /var/www/html/public/.htaccess
COPY public/api/api.php public/api/config.php public/api/logger.php public/api/version.php /var/www/html/public/api/
COPY public/uploads/.htaccess /var/www/html/public/uploads/.htaccess
COPY public/health.php /var/www/html/public/health.php
COPY --from=frontend-build /src/dist/ /var/www/html/public/
COPY --from=frontend-build /src/dist/ /var/www/html/dist/

RUN mkdir -p /var/www/html/public/uploads/trends /var/www/html/public/uploads/informes /var/www/html/logs /var/lib/php/sessions \
    && chown -R www-data:www-data /var/www/html/public/uploads /var/www/html/logs /var/lib/php/sessions

EXPOSE 80
