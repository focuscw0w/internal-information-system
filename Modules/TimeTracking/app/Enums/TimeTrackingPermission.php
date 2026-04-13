<?php

namespace Modules\TimeTracking\Enums;

enum TimeTrackingPermission: string
{
    case VIEW_ALL_TIME_ENTRIES = 'view_all_time_entries';
    case MANAGE_TIME_ENTRIES = 'manage_time_entries';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match($this) {
            self::VIEW_ALL_TIME_ENTRIES => 'Zobraziť všetky záznamy času',
            self::MANAGE_TIME_ENTRIES => 'Spravovať záznamy času',
        };
    }

    public function description(): string
    {
        return match($this) {
            self::VIEW_ALL_TIME_ENTRIES => 'Môže zobraziť záznamy času všetkých členov tímu',
            self::MANAGE_TIME_ENTRIES => 'Môže vytvárať záznamy pre nepridelené úlohy a upravovať/mazať záznamy ostatných',
        };
    }

    public function isReadOnly(): bool
    {
        return $this === self::VIEW_ALL_TIME_ENTRIES;
    }
}
