# ============================================
# Stage 1: PHP production base
# ============================================
FROM php:8.4-fpm-alpine AS php-base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    icu-dev \
    linux-headers \
    oniguruma-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    zip \
    intl \
    pcntl \
    bcmath \
    opcache \
    mbstring

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application source
COPY . .

# Install production dependencies
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

# Copy custom PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini

# ============================================
# Stage 2: Build frontend assets (needs PHP for wayfinder plugin)
# ============================================
FROM php-base AS asset-builder

# Install Node.js for Vite build
RUN apk add --no-cache nodejs npm

COPY package.json package-lock.json ./
RUN npm ci

# Build frontend assets (wayfinder plugin runs php artisan internally)
RUN npm run build

# ============================================
# Stage 3: Final production image
# ============================================
FROM php-base AS php-production

# Copy built frontend assets from asset-builder
COPY --from=asset-builder /var/www/html/public/build/ public/build/

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]

# ============================================
# Stage 4: PHP development (with dev deps + SQLite for tests)
# ============================================
FROM php-base AS php-dev

# Install SQLite for tests
RUN apk add --no-cache sqlite-dev \
    && docker-php-ext-install pdo_sqlite

# Install dev dependencies
RUN composer install --prefer-dist --no-interaction --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]

# ============================================
# Stage 5: Vite dev server (PHP + Node for wayfinder plugin)
# ============================================
FROM php-dev AS php-node

RUN apk add --no-cache nodejs npm

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
