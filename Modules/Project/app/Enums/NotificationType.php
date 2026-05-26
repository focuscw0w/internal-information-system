<?php

namespace Modules\Project\Enums;

enum NotificationType: string
{
    case DEADLINE_APPROACHING = 'deadline_approaching';
    case TASK_STATUS_CHANGED  = 'task_status_changed';
    case TASK_ASSIGNED        = 'task_assigned';
    case PROJECT_ASSIGNED     = 'project_assigned';
    case TASK_AT_RISK             = 'task_at_risk';
    case PROJECT_OVERDUE          = 'project_overdue';
    case USER_OVERLOADED          = 'user_overloaded';
    case PROJECT_CAPACITY_AT_RISK = 'project_capacity_at_risk';
    case PROJECT_HIGH_PRIORITY    = 'project_high_priority';
    case TASK_HOURS_EXCEEDED      = 'task_hours_exceeded';
    case PROJECT_STATUS_CHANGED      = 'project_status_changed';
    case PASSWORD_RESET_REQUESTED    = 'password_reset_requested';
    case COMMENT_MENTIONED           = 'comment_mentioned';

    public function label(): string
    {
        return match ($this) {
            self::DEADLINE_APPROACHING    => 'Blížiaci sa termín',
            self::TASK_STATUS_CHANGED     => 'Zmena stavu úlohy',
            self::TASK_ASSIGNED           => 'Priradenie úlohy',
            self::PROJECT_ASSIGNED        => 'Pridanie do projektu',
            self::TASK_AT_RISK            => 'Ohrozená úloha',
            self::PROJECT_OVERDUE         => 'Oneskorený projekt',
            self::USER_OVERLOADED         => 'Preťažený používateľ',
            self::PROJECT_CAPACITY_AT_RISK => 'Projekt ohrozený kapacitou',
            self::PROJECT_HIGH_PRIORITY   => 'Vysoká priorita projektu',
            self::TASK_HOURS_EXCEEDED     => 'Prekročené hodiny úlohy',
            self::PROJECT_STATUS_CHANGED  => 'Zmena stavu projektu',
            self::PASSWORD_RESET_REQUESTED => 'Žiadosť o reset hesla',
            self::COMMENT_MENTIONED        => 'Označenie v komentári',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::DEADLINE_APPROACHING    => 'clock',
            self::TASK_STATUS_CHANGED     => 'arrow-right-left',
            self::TASK_ASSIGNED           => 'user-plus',
            self::PROJECT_ASSIGNED        => 'user-plus',
            self::TASK_AT_RISK            => 'alert-triangle',
            self::PROJECT_OVERDUE         => 'alert-circle',
            self::USER_OVERLOADED         => 'alert-triangle',
            self::PROJECT_CAPACITY_AT_RISK => 'trending-down',
            self::PROJECT_HIGH_PRIORITY   => 'flame',
            self::TASK_HOURS_EXCEEDED     => 'clock-alert',
            self::PROJECT_STATUS_CHANGED  => 'refresh-cw',
            self::PASSWORD_RESET_REQUESTED => 'key-round',
            self::COMMENT_MENTIONED        => 'at-sign',
        };
    }

    public function priority(): string
    {
        return match ($this) {
            self::DEADLINE_APPROACHING    => 'high',
            self::TASK_STATUS_CHANGED     => 'low',
            self::TASK_ASSIGNED           => 'medium',
            self::PROJECT_ASSIGNED        => 'medium',
            self::TASK_AT_RISK            => 'high',
            self::PROJECT_OVERDUE         => 'high',
            self::USER_OVERLOADED         => 'high',
            self::PROJECT_CAPACITY_AT_RISK => 'high',
            self::PROJECT_HIGH_PRIORITY   => 'medium',
            self::TASK_HOURS_EXCEEDED     => 'high',
            self::PROJECT_STATUS_CHANGED  => 'low',
            self::PASSWORD_RESET_REQUESTED => 'high',
            self::COMMENT_MENTIONED        => 'medium',
        };
    }
}
