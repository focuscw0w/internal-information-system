<?php

namespace Modules\Project\Enums;

enum ProjectPriority: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case URGENT = 'urgent';

    /**
     * Get all enum values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get label for priority (pre UI)
     */
    public function label(): string
    {
        return match ($this) {
            self::LOW => 'Nízka',
            self::MEDIUM => 'Stredná',
            self::HIGH => 'Vysoká',
            self::URGENT => 'Urgentná',
        };
    }

    /**
     * Get color class for priority (Tailwind)
     */
    public function color(): string
    {
        return match ($this) {
            self::LOW => 'bg-green-100 text-green-700',
            self::MEDIUM => 'bg-yellow-100 text-yellow-700',
            self::HIGH => 'bg-orange-100 text-orange-700',
            self::URGENT => 'bg-red-100 text-red-700',
        };
    }

    /**
     * Get icon for priority
     */
    public function icon(): string
    {
        return match ($this) {
            self::LOW => '⬇️',
            self::MEDIUM => '➡️',
            self::HIGH => '⬆️',
            self::URGENT => '🔥',
        };
    }

    /**
     * Get numeric weight for calculations
     */
    public function weight(): int
    {
        return match ($this) {
            self::LOW => 1,
            self::MEDIUM => 2,
            self::HIGH => 3,
            self::URGENT => 4,
        };
    }

    /**
     * Check if priority is critical (high or urgent)
     */
    public function isCritical(): bool
    {
        return $this === self::HIGH || $this === self::URGENT;
    }

    /**
     * Check if priority is safe (low or medium)
     */
    public function isSafe(): bool
    {
        return $this === self::LOW || $this === self::MEDIUM;
    }

    /**
     * Compare with another priority
     */
    public function isHigherThan(self $other): bool
    {
        return $this->weight() > $other->weight();
    }

    /**
     * Compare with another priority
     */
    public function isLowerThan(self $other): bool
    {
        return $this->weight() < $other->weight();
    }
}
