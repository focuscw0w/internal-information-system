<?php

namespace Modules\User\Enums;

use Modules\User\Contracts\PermissionEnumInterface;

enum UserPermission: string implements PermissionEnumInterface
{
    case USERS_VIEW = 'users.view';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Zobrazenie používateľov',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Používateľ vidí zoznam ostatných používateľov v systéme.',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Používatelia',
        };
    }
}
