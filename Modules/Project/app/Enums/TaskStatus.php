<?php

namespace Modules\Project\Enums;

enum TaskStatus: string
{
    case TODO = 'todo';
    case IN_PROGRESS = 'in_progress';
    case TESTING = 'testing';
    case DONE = 'done';

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
            self::TODO => 'Na vykonanie',
            self::IN_PROGRESS => 'Prebieha',
            self::TESTING => 'Testovanie',
            self::DONE => 'Hotovo',
        };
    }

    /**
     * Get color class for status (Tailwind)
     */
    public function color(): string
    {
        return match ($this) {
            self::TODO => 'bg-gray-100 text-gray-700',
            self::IN_PROGRESS => 'bg-blue-100 text-blue-700',
            self::TESTING => 'bg-yellow-100 text-yellow-700',
            self::DONE => 'bg-green-100 text-green-700',
        };
    }

    /**
     * Get badge variant for UI
     */
    public function badge(): string
    {
        return match ($this) {
            self::TODO => 'secondary',
            self::IN_PROGRESS => 'info',
            self::TESTING => 'warning',
            self::DONE => 'success',
        };
    }

    /**
     * Check if status is completed
     */
    public function isCompleted(): bool
    {
        return $this === self::DONE;
    }

    /**
     * Check if status is in progress
     */
    public function isInProgress(): bool
    {
        return $this === self::IN_PROGRESS || $this === self::TESTING;
    }

    /**
     * Get next status in workflow
     */
    public function next(): ?self
    {
        return match ($this) {
            self::TODO => self::IN_PROGRESS,
            self::IN_PROGRESS => self::TESTING,
            self::TESTING => self::DONE,
            self::DONE => null,
        };
    }

    /**
     * Get previous status in workflow
     */
    public function previous(): ?self
    {
        return match ($this) {
            self::TODO => null,
            self::IN_PROGRESS => self::TODO,
            self::TESTING => self::IN_PROGRESS,
            self::DONE => self::TESTING,
        };
    }
}