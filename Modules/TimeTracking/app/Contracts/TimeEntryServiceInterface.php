<?php

namespace Modules\TimeTracking\Contracts;

use Illuminate\Support\Collection;
use Modules\TimeTracking\Models\TimeEntry;

interface TimeEntryServiceInterface
{
    /**
     * Get all time entries for a project.
     */
    public function getByProject(int $projectId, array $filters = []): Collection;

    /**
     * Get all time entries for a task.
     */
    public function getByTask(int $taskId): Collection;

    /**
     * Create a new time entry.
     */
    public function create(array $data): TimeEntry;

    /**
     * Update an existing time entry.
     */
    public function update(int $entryId, array $data): bool;

    /**
     * Delete a time entry.
     */
    public function delete(int $entryId): bool;
}
