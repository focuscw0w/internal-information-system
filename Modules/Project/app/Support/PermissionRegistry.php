<?php

namespace Modules\Project\Support;

class PermissionRegistry
{
    private static array $registered = [];

    public static function register(array $values): void
    {
        self::$registered = array_merge(self::$registered, $values);
    }

    public static function extra(): array
    {
        return self::$registered;
    }
}
