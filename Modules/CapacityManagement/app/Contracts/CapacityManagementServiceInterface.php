<?php

namespace Modules\CapacityManagement\Contracts;

interface CapacityManagementServiceInterface
{
    /**
     * Build the full capacity dashboard data.
     *
     * @return array{
     *     people: array<int, array<string, mixed>>,
     *     alerts: array<int, array<string, mixed>>,
     *     free_people: array<int, array<string, mixed>>,
     *     weekly_overview: array<string, mixed>,
     *     monthly_overview: array<string, mixed>,
     *     prediction: array<string, mixed>,
     *     history: array<int, array<string, mixed>>
     * }
     */
    public function buildDashboard(): array;

    /**
     * Set or update the weekly capacity hours for a specific user.
     */
    public function setWeeklyCapacityForUser(int $userId, int $hours): void;
}
