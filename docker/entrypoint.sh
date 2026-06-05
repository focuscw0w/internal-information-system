#!/bin/sh
set -e

if [ -f artisan ]; then
    mkdir -p \
        storage/logs \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        bootstrap/cache

    touch storage/logs/laravel.log

    chown -R www-data:www-data storage bootstrap/cache
    chmod -R 775 storage bootstrap/cache
    chmod 664 storage/logs/laravel.log

    php artisan optimize:clear
fi

exec "$@"
