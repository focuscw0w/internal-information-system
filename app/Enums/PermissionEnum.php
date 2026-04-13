<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Users
    case USERS_VIEW = 'users.view';

    // Projects
    case PROJECTS_CREATE = 'projects.create';
    case PROJECTS_VIEW_ALL = 'projects.view_all';

    // Capacity
    case CAPACITY_MANAGE = 'capacity.manage';

    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Zobrazenie používateľov',
            self::PROJECTS_CREATE => 'Vytváranie projektov',
            self::PROJECTS_VIEW_ALL => 'Zobrazenie všetkých projektov',
            self::CAPACITY_MANAGE => 'Správa kapacít',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Používateľ vidí zoznam ostatných používateľov v systéme.',
            self::PROJECTS_CREATE => 'Používateľ môže zakladať nové projekty.',
            self::PROJECTS_VIEW_ALL => 'Používateľ vidí všetky projekty bez nutnosti byť členom tímu projektu.',
            self::CAPACITY_MANAGE => 'Používateľ môže upravovať týždenné kapacity zamestnancov.',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'Používatelia',
            self::PROJECTS_CREATE, self::PROJECTS_VIEW_ALL => 'Projekty',
            self::CAPACITY_MANAGE => 'Kapacity',
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
