<?php

namespace Modules\Project\Enums;

enum TaskPriority: string
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
            self::LOW => 'bg-gray-100 text-gray-700',
            self::MEDIUM => 'bg-blue-100 text-blue-700',
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
     * Get numeric weight for sorting
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
     * Check if priority is high or urgent
     */
    public function isCritical(): bool
    {
        return $this === self::HIGH || $this === self::URGENT;
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