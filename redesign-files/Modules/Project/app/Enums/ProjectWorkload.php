<?php

namespace Modules\Project\Enums;

enum ProjectWorkload: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case OVERLOADED = 'overloaded';

    /**
     * Get all enum values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get label for workload (pre UI)
     */
    public function label(): string
    {
        return match ($this) {
            self::LOW => 'Nízke',
            self::MEDIUM => 'Stredné',
            self::HIGH => 'Vysoké',
            self::OVERLOADED => 'Preťažené',
        };
    }

    /**
     * Get color class for workload (Tailwind)
     */
    public function color(): string
    {
        return match ($this) {
            self::LOW => 'bg-green-100 text-green-700',
            self::MEDIUM => 'bg-yellow-100 text-yellow-700',
            self::HIGH => 'bg-orange-100 text-orange-700',
            self::OVERLOADED => 'bg-red-100 text-red-700',
        };
    }

    /**
     * Get icon for workload
     */
    public function icon(): string
    {
        return match ($this) {
            self::LOW => '😌',
            self::MEDIUM => '😐',
            self::HIGH => '😰',
            self::OVERLOADED => '🔥',
        };
    }

    /**
     * Get percentage range for workload
     */
    public function percentageRange(): array
    {
        return match ($this) {
            self::LOW => [0, 40],
            self::MEDIUM => [41, 70],
            self::HIGH => [71, 90],
            self::OVERLOADED => [91, 100],
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
            self::OVERLOADED => 4,
        };
    }

    /**
     * Check if workload is critical
     */
    public function isCritical(): bool
    {
        return $this === self::HIGH || $this === self::OVERLOADED;
    }

    /**
     * Check if workload is safe
     */
    public function isSafe(): bool
    {
        return $this === self::LOW || $this === self::MEDIUM;
    }

    /**
     * Get workload from percentage
     */
    public static function fromPercentage(float $percentage): self
    {
        return match (true) {
            $percentage <= 40 => self::LOW,
            $percentage <= 70 => self::MEDIUM,
            $percentage <= 90 => self::HIGH,
            default => self::OVERLOADED,
        };
    }

    /**
     * Compare with another workload
     */
    public function isHigherThan(self $other): bool
    {
        return $this->weight() > $other->weight();
    }

    /**
     * Compare with another workload
     */
    public function isLowerThan(self $other): bool
    {
        return $this->weight() < $other->weight();
    }
}