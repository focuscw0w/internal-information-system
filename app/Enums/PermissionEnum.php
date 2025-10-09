<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Pricing
    case PRICING_VIEW = 'pricing.view';
    case PRICING_EDIT = 'pricing.edit';

    // Time tracking
    case TIME_TRACKING_VIEW = 'time-tracking.view';

    // Users
    case USERS_VIEW = 'users.view';
    case USERS_MANAGE = 'users.manage';

    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }
}
