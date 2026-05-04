<?php

namespace Modules\TimeTracking\Enums;

enum TimeEntryStatusEnum: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Čaká na schválenie',
            self::Approved => 'Schválené',
            self::Rejected => 'Zamietnuté',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
