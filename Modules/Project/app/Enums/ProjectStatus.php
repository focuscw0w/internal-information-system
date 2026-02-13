<?php

namespace Modules\Project\Enums;

enum ProjectStatus: string
{
    case PLANNING = 'planning';
    case ACTIVE = 'active';
    case ON_HOLD = 'on_hold';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    /**
     * Get all enum values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get label for status (pre UI)
     */
    public function label(): string
    {
        return match ($this) {
            self::PLANNING => 'Plánovanie',
            self::ACTIVE => 'Aktívny',
            self::ON_HOLD => 'Pozastavený',
            self::COMPLETED => 'Dokončený',
            self::CANCELLED => 'Zrušený',
        };
    }

    /**
     * Get color class for status (Tailwind)
     */
    public function color(): string
    {
        return match ($this) {
            self::PLANNING => 'bg-purple-100 text-purple-700',
            self::ACTIVE => 'bg-green-100 text-green-700',
            self::ON_HOLD => 'bg-yellow-100 text-yellow-700',
            self::COMPLETED => 'bg-blue-100 text-blue-700',
            self::CANCELLED => 'bg-red-100 text-red-700',
        };
    }

    /**
     * Get badge variant for UI
     */
    public function badge(): string
    {
        return match ($this) {
            self::PLANNING => 'secondary',
            self::ACTIVE => 'success',
            self::ON_HOLD => 'warning',
            self::COMPLETED => 'info',
            self::CANCELLED => 'danger',
        };
    }

    /**
     * Check if project is active
     */
    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    /**
     * Check if project is completed
     */
    public function isCompleted(): bool
    {
        return $this === self::COMPLETED;
    }

    /**
     * Check if project is in progress (active or on hold)
     */
    public function isInProgress(): bool
    {
        return $this === self::ACTIVE || $this === self::ON_HOLD;
    }

    /**
     * Check if project can be worked on
     */
    public function canWorkOn(): bool
    {
        return $this === self::ACTIVE || $this === self::PLANNING;
    }

    /**
     * Check if project is finished (completed or cancelled)
     */
    public function isFinished(): bool
    {
        return $this === self::COMPLETED || $this === self::CANCELLED;
    }
}