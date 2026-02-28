<?php

namespace Modules\Project\Enums;

enum ProjectPermission: string
{
    // Project permissions
    case VIEW_PROJECT = 'view_project';
    case EDIT_PROJECT = 'edit_project';
    case DELETE_PROJECT = 'delete_project';

    // Task permissions
    case VIEW_TASKS = 'view_tasks';
    case CREATE_TASKS = 'create_tasks';
    case EDIT_TASKS = 'edit_tasks';
    case DELETE_TASKS = 'delete_tasks';
    case ASSIGN_TASKS = 'assign_tasks';

    // Team permissions
    case VIEW_TEAM = 'view_team';
    case MANAGE_TEAM = 'manage_team';

    // Data permissions
    case EXPORT_DATA = 'export_data';

    /**
     * Get all enum values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get label for permission (pre UI)
     */
    public function label(): string
    {
        return match($this) {
            self::VIEW_PROJECT => 'Zobraziť projekt',
            self::EDIT_PROJECT => 'Upraviť projekt',
            self::DELETE_PROJECT => 'Zmazať projekt',
            self::VIEW_TASKS => 'Zobraziť úlohy',
            self::CREATE_TASKS => 'Vytvoriť úlohy',
            self::EDIT_TASKS => 'Upraviť úlohy',
            self::DELETE_TASKS => 'Zmazať úlohy',
            self::ASSIGN_TASKS => 'Priradiť úlohy',
            self::VIEW_TEAM => 'Zobraziť tím',
            self::MANAGE_TEAM => 'Spravovať tím',
            self::EXPORT_DATA => 'Exportovať dáta',
        };
    }

    /**
     * Get description for permission
     */
    public function description(): string
    {
        return match($this) {
            self::VIEW_PROJECT => 'Môže zobraziť detaily projektu',
            self::EDIT_PROJECT => 'Môže upravovať názov, popis, dátumy a nastavenia projektu',
            self::DELETE_PROJECT => 'Môže natrvalo zmazať projekt',
            self::VIEW_TASKS => 'Môže zobraziť úlohy v projekte',
            self::CREATE_TASKS => 'Môže vytvárať nové úlohy',
            self::EDIT_TASKS => 'Môže upravovať existujúce úlohy',
            self::DELETE_TASKS => 'Môže mazať úlohy',
            self::ASSIGN_TASKS => 'Môže priraďovať úlohy členom tímu',
            self::VIEW_TEAM => 'Môže zobraziť členov tímu',
            self::MANAGE_TEAM => 'Môže pridávať a odstraňovať členov tímu',
            self::EXPORT_DATA => 'Môže exportovať dáta projektu',
        };
    }

    /**
     * Get category of permission
     */
    public function category(): string
    {
        return match($this) {
            self::VIEW_PROJECT, self::EDIT_PROJECT, self::DELETE_PROJECT
                => 'Projekt',
            self::VIEW_TASKS, self::CREATE_TASKS, self::EDIT_TASKS,
            self::DELETE_TASKS, self::ASSIGN_TASKS
                => 'Úlohy',
            self::VIEW_TEAM, self::MANAGE_TEAM
                => 'Tím',
            self::EXPORT_DATA
                => 'Dáta',
        };
    }

    /**
     * Check if permission is read-only
     */
    public function isReadOnly(): bool
    {
        return in_array($this, [
            self::VIEW_PROJECT,
            self::VIEW_TASKS,
            self::VIEW_TEAM,
        ]);
    }

    /**
     * Get all permissions grouped by category
     */
    public static function groupedByCategory(): array
    {
        $grouped = [];

        foreach (self::cases() as $permission) {
            $category = $permission->category();
            $grouped[$category][] = [
                'value' => $permission->value,
                'label' => $permission->label(),
                'description' => $permission->description(),
                'icon' => $permission->icon(),
                'dangerous' => $permission->isDangerous(),
                'readOnly' => $permission->isReadOnly(),
            ];
        }

        return $grouped;
    }

    /**
     * Get all view permissions
     */
    public static function viewPermissions(): array
    {
        return [
            self::VIEW_PROJECT->value,
            self::VIEW_TASKS->value,
            self::VIEW_TEAM->value,
        ];
    }

    /**
     * Get all edit permissions
     */
    public static function editPermissions(): array
    {
        return [
            self::EDIT_PROJECT->value,
            self::CREATE_TASKS->value,
            self::EDIT_TASKS->value,
            self::ASSIGN_TASKS->value,
        ];
    }

    /**
     * Get all delete permissions
     */
    public static function deletePermissions(): array
    {
        return [
            self::DELETE_PROJECT->value,
            self::DELETE_TASKS->value,
        ];
    }

    /**
     * Get all dangerous permissions
     */
    public static function dangerousPermissions(): array
    {
        return array_filter(
            self::values(),
            fn($value) => self::from($value)->isDangerous()
        );
    }
}
