<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Users
    case USERS_VIEW = 'users.view';
    case USERS_MANAGE = 'users.manage';

    // Projects
    case PROJECTS_CREATE = 'projects.create';
    case PROJECTS_VIEW_ALL = 'projects.view_all';

    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Zobrazenie používateľov',
            self::USERS_MANAGE => 'Správa používateľov',
            self::PROJECTS_CREATE => 'Vytváranie projektov',
            self::PROJECTS_VIEW_ALL => 'Zobrazenie všetkých projektov',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Používateľ vidí zoznam ostatných používateľov v systéme.',
            self::USERS_MANAGE => 'Používateľ môže vytvárať nové kontá a spravovať existujúcich používateľov.',
            self::PROJECTS_CREATE => 'Používateľ môže zakladať nové projekty.',
            self::PROJECTS_VIEW_ALL => 'Používateľ vidí všetky projekty bez nutnosti byť členom tímu projektu.',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::USERS_VIEW, self::USERS_MANAGE => 'Používatelia',
            self::PROJECTS_CREATE, self::PROJECTS_VIEW_ALL => 'Projekty',
        };
    }

    /**
     * Grouped permissions for frontend (select/checkbox UI).
     *
     * @return array<string, array<int, array{value: string, label: string, description: string}>>
     */
    public static function groupedForFrontend(): array
    {
        $grouped = [];

        foreach (self::cases() as $case) {
            $grouped[$case->group()][] = [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
            ];
        }

        return $grouped;
    }
}
