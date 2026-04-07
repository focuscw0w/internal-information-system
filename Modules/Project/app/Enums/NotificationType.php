<?php

namespace Modules\Project\Enums;

enum NotificationType: string
{
    case DEADLINE_APPROACHING = 'deadline_approaching';
    case TASK_STATUS_CHANGED  = 'task_status_changed';
    case TASK_ASSIGNED        = 'task_assigned';
    case TASK_AT_RISK         = 'task_at_risk';
    case PROJECT_OVERDUE      = 'project_overdue';

    public function label(): string
    {
        return match ($this) {
            self::DEADLINE_APPROACHING => 'Blížiaci sa termín',
            self::TASK_STATUS_CHANGED  => 'Zmena stavu úlohy',
            self::TASK_ASSIGNED        => 'Priradenie úlohy',
            self::TASK_AT_RISK         => 'Ohrozená úloha',
            self::PROJECT_OVERDUE      => 'Oneskorený projekt',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::DEADLINE_APPROACHING => 'clock',
            self::TASK_STATUS_CHANGED  => 'arrow-right-left',
            self::TASK_ASSIGNED        => 'user-plus',
            self::TASK_AT_RISK         => 'alert-triangle',
            self::PROJECT_OVERDUE      => 'alert-circle',
        };
    }

    public function priority(): string
    {
        return match ($this) {
            self::DEADLINE_APPROACHING => 'high',
            self::TASK_STATUS_CHANGED  => 'low',
            self::TASK_ASSIGNED        => 'medium',
            self::TASK_AT_RISK         => 'high',
            self::PROJECT_OVERDUE      => 'high',
        };
    }
}
