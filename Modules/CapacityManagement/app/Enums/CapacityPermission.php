<?php

namespace Modules\CapacityManagement\Enums;

use Modules\User\Contracts\PermissionEnumInterface;

enum CapacityPermission: string implements PermissionEnumInterface
{
    case CAPACITY_MANAGE = 'capacity.manage';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::CAPACITY_MANAGE => 'Správa kapacít',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::CAPACITY_MANAGE => 'Používateľ môže upravovať týždenné kapacity zamestnancov.',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::CAPACITY_MANAGE => 'Kapacity',
        };
    }
}
