<?php

namespace Modules\TimeTracking\Services;

use Illuminate\Support\Collection;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Transformers\TimeEntryResource;
use Modules\User\Models\User;

class TimeEntryService implements TimeEntryServiceInterface
{
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
            $query->where('entry_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('entry_date', '<=', $filters['date_to']);
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

        return $entry;
    }

    /**
     * Update an existing time entry and sync task actual_hours.
     */
    public function update(int $entryId, array $data): bool
    {
        $entry = TimeEntry::findOrFail($entryId);
        $project = Project::findOrFail($entry->project_id);

        if (! $project->userHasPermission(auth()->user(), 'manage_team')
            && $entry->user_id !== auth()->id()) {
            abort(403);
        }

        $oldTaskId = $entry->task_id;
        $updated = $entry->update($data);

        if ($updated) {
            $this->syncTaskHours($oldTaskId);

            if (isset($data['task_id']) && $data['task_id'] !== $oldTaskId) {
                $this->syncTaskHours($data['task_id']);
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

        if (! $project->userHasPermission(auth()->user(), 'manage_team')
            && $entry->user_id !== auth()->id()) {
            abort(403);
        }

        $taskId = $entry->task_id;
        $deleted = $entry->delete();

        if ($deleted) {
            $this->syncTaskHours($taskId);
        }

        return $deleted;
    }

    /**
     * Recalculate task actual_hours from sum of time entries.
     */
    private function syncTaskHours(int $taskId): void
    {
        $total = TimeEntry::where('task_id', $taskId)->sum('hours');

        Task::where('id', $taskId)->update([
            'actual_hours' => $total,
        ]);
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
