<?php

namespace Modules\TimeTracking\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Contracts\ProjectAllocationSyncInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeEntryRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingProjectRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingTaskRepositoryInterface;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Transformers\TimeEntryResource;
use Modules\User\Models\User;

class TimeEntryService implements TimeEntryServiceInterface
{
    public function __construct(
        private readonly NotificationServiceInterface $notificationService,
        private readonly TimeEntryRepositoryInterface $timeEntries,
        private readonly TimeTrackingProjectRepositoryInterface $projects,
        private readonly TimeTrackingTaskRepositoryInterface $tasks,
        private readonly ?ProjectAllocationSyncInterface $allocationSyncService = null,
    ) {}
    /**
     * Get total tracked hours per user in a time period.
     */
    public function getTotalHoursPerUserInPeriod(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): Collection
    {
        return $this->timeEntries->totalHoursPerUserInPeriod($from, $to, $userIds, $projectIds, $status);
    }

    /**
     * Get tracked hours grouped by week and user.
     */
    public function getHoursGroupedByWeekAndUser(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): array
    {
        return $this->timeEntries->hoursGroupedByWeekAndUser($from, $to, $userIds, $projectIds, $status);
    }

    public function getTotalHoursPerProjectInPeriod(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'approved',
    ): Collection {
        return $this->timeEntries->totalHoursPerProjectInPeriod($from, $to, $userIds, $projectIds, $status);
    }

    /**
     * Get all time entries for a project.
     */
    public function getByProject(int $projectId, array $filters = []): Collection
    {
        return $this->timeEntries->getByProject($projectId, $filters);
    }

    /**
     * Get all time entries for a task.
     */
    public function getByTask(int $taskId): Collection
    {
        return $this->timeEntries->getByTask($taskId);
    }

    /**
     * Create a new time entry and sync task actual_hours.
     */
    public function create(array $data): TimeEntry
    {
        $entry = $this->timeEntries->create($data);

        $this->syncTaskHours($entry->task_id);
        $this->syncAllocationHours($entry->project_id, $entry->user_id);

        return $entry;
    }

    /**
     * Update an existing time entry and sync task actual_hours.
     */
    public function update(int $entryId, array $data): bool
    {
        $entry = $this->timeEntries->findOrFail($entryId);
        $project = $this->projects->findOrFail($entry->project_id);
        $oldProjectId = $entry->project_id;
        $oldUserId = $entry->user_id;

        if (! $project->userHasPermission(auth()->user(), 'manage_time_entries')) {
            abort(403);
        }

        $oldTaskId = $entry->task_id;
        $updated = $this->timeEntries->update($entry, $data);

        if ($updated) {
            $this->syncTaskHours($oldTaskId);
            $this->syncAllocationHours($oldProjectId, $oldUserId);

            if (isset($data['task_id']) && $data['task_id'] !== $oldTaskId) {
                $this->syncTaskHours($data['task_id']);
            }

            if ($entry->project_id !== $oldProjectId || $entry->user_id !== $oldUserId) {
                $this->syncAllocationHours($entry->project_id, $entry->user_id);
            }
        }

        return $updated;
    }

    /**
     * Delete a time entry and sync task actual_hours.
     */
    public function delete(int $entryId): bool
    {
        $entry = $this->timeEntries->findOrFail($entryId);
        $project = $this->projects->findOrFail($entry->project_id);

        if (! $project->userHasPermission(auth()->user(), 'manage_time_entries')) {
            abort(403);
        }

        $taskId = $entry->task_id;
        $deleted = $this->timeEntries->delete($entry);

        if ($deleted) {
            $this->syncTaskHours($taskId);
            $this->syncAllocationHours($entry->project_id, $entry->user_id);
        }

        return $deleted;
    }

    /**
     * Recalculate task actual_hours from sum of time entries.
     */
    private function syncTaskHours(int $taskId): void
    {
        $total = $this->timeEntries->totalHoursForTask($taskId);
        $this->tasks->updateActualHours($taskId, $total);

        $task = $this->tasks->findForHoursExceededCheck($taskId);
        if ($task && $task->estimated_hours > 0 && $task->actual_hours > $task->estimated_hours) {
            $this->notificationService->notifyTaskHoursExceeded($task);
        }
    }

    private function syncAllocationHours(int $projectId, int $userId): void
    {
        $this->allocationSyncService?->syncUsedHoursForProjectUser($projectId, $userId);
    }

    /**
     * Get a summary of user's time tracking data for profile page.
     */
    public function getUserSummary(User $user): array
    {
        return [
            'total_hours_this_week' => $this->timeEntries->totalHoursThisWeekForUser($user),
            'total_hours_this_month' => $this->timeEntries->totalHoursThisMonthForUser($user),
            'recent_entries' => TimeEntryResource::collection(
                $this->timeEntries->recentEntriesForUser($user)
            )->resolve(),
        ];
    }
}
