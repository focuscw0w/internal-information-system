<?php

namespace Modules\TimeTracking\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Services\ProjectAllocationSyncService;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Transformers\TimeEntryResource;
use Modules\User\Models\User;

class TimeEntryService implements TimeEntryServiceInterface
{
    public function __construct(
        private readonly NotificationServiceInterface $notificationService,
        private readonly ?ProjectAllocationSyncService $allocationSyncService = null,
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
        return $this->filteredPeriodQuery($from, $to, $userIds, $projectIds, $status)
            ->selectRaw('user_id, COALESCE(SUM(hours), 0) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');
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
        return $this->filteredPeriodQuery($from, $to, $userIds, $projectIds, $status)
            ->get(['user_id', 'entry_date', 'hours'])
            ->groupBy(fn ($e) => $e->entry_date->format('o-W'))
            ->map(fn ($week) =>
                $week->groupBy('user_id')
                    ->map(fn ($u) => (float) $u->sum('hours'))
                    ->all()
            )
            ->all();
    }

    public function getTotalHoursPerProjectInPeriod(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'approved',
    ): Collection {
        return $this->filteredPeriodQuery($from, $to, $userIds, $projectIds, $status)
            ->selectRaw('project_id, COALESCE(SUM(hours), 0) as total')
            ->groupBy('project_id')
            ->pluck('total', 'project_id');
    }

    /**
     * Get all time entries for a project.
     */
    public function getByProject(int $projectId, array $filters = []): Collection
    {
        $query = TimeEntry::with(['task', 'user'])
            ->where('project_id', $projectId)
            ->orderByDesc('entry_date');

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['task_id'])) {
            $query->where('task_id', $filters['task_id']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('entry_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('entry_date', '<=', $filters['date_to']);
        }

        return $query->get();
    }

    /**
     * Get all time entries for a task.
     */
    public function getByTask(int $taskId): Collection
    {
        return TimeEntry::with(['user'])
            ->where('task_id', $taskId)
            ->orderByDesc('entry_date')
            ->get();
    }

    /**
     * Create a new time entry and sync task actual_hours.
     */
    public function create(array $data): TimeEntry
    {
        $entry = TimeEntry::create($data);

        $this->syncTaskHours($entry->task_id);
        $this->syncAllocationHours($entry->project_id, $entry->user_id);

        return $entry;
    }

    /**
     * Update an existing time entry and sync task actual_hours.
     */
    public function update(int $entryId, array $data): bool
    {
        $entry = TimeEntry::findOrFail($entryId);
        $project = Project::findOrFail($entry->project_id);
        $oldProjectId = $entry->project_id;
        $oldUserId = $entry->user_id;

        if (! $project->userHasPermission(auth()->user(), 'manage_time_entries')
            && (! $project->userIsParticipant(auth()->user()) || $entry->user_id !== auth()->id())) {
            abort(403);
        }

        $oldTaskId = $entry->task_id;
        $updated = $entry->update($data);

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
        $entry = TimeEntry::findOrFail($entryId);
        $project = Project::findOrFail($entry->project_id);

        if (! $project->userHasPermission(auth()->user(), 'manage_time_entries')
            && (! $project->userIsParticipant(auth()->user()) || $entry->user_id !== auth()->id())) {
            abort(403);
        }

        $taskId = $entry->task_id;
        $deleted = $entry->delete();

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
        $total = round((float) TimeEntry::where('task_id', $taskId)->sum('hours'), 2);

        Task::where('id', $taskId)->update([
            'actual_hours' => $total,
        ]);

        $task = Task::find($taskId);
        if ($task && $task->estimated_hours > 0 && $task->actual_hours > $task->estimated_hours) {
            $this->notificationService->notifyTaskHoursExceeded($task);
        }
    }

    private function syncAllocationHours(int $projectId, int $userId): void
    {
        $this->allocationSyncService?->syncUsedHoursForProjectUser($projectId, $userId);
    }

    private function filteredPeriodQuery(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): \Illuminate\Database\Eloquent\Builder {
        $query = TimeEntry::query()
            ->whereDate('entry_date', '>=', $from)
            ->whereDate('entry_date', '<=', $to);

        if ($userIds !== null) {
            $query->whereIn('user_id', array_map('intval', $userIds));
        }

        if ($projectIds !== null) {
            $query->whereIn('project_id', array_map('intval', $projectIds));
        }

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return $query;
    }

    /**
     * Get a summary of user's time tracking data for profile page.
     */
    public function getUserSummary(User $user): array
    {
        $baseQuery = TimeEntry::forUser($user->id);

        return [
            'total_hours_this_week' => (clone $baseQuery)->thisWeek()->sum('hours'),
            'total_hours_this_month' => (clone $baseQuery)->thisMonth()->sum('hours'),
            'recent_entries' => TimeEntryResource::collection(
                (clone $baseQuery)
                    ->with(['task', 'project'])
                    ->latest('entry_date')
                    ->limit(5)
                    ->get()
            )->resolve(),
        ];
    }
}
