<?php

namespace Modules\Project\Enums;

use Modules\User\Contracts\PermissionEnumInterface;

enum ProjectGlobalPermission: string implements PermissionEnumInterface
{
    case PROJECTS_CREATE = 'projects.create';
    case PROJECTS_VIEW_ALL = 'projects.view_all';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::PROJECTS_CREATE => 'Vytváranie projektov',
            self::PROJECTS_VIEW_ALL => 'Zobrazenie všetkých projektov',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PROJECTS_CREATE => 'Používateľ môže zakladať nové projekty.',
            self::PROJECTS_VIEW_ALL => 'Používateľ vidí všetky projekty bez nutnosti byť členom tímu projektu.',
        };
    }

    public function group(): string
    {
        return 'Projekty';
    }
}
