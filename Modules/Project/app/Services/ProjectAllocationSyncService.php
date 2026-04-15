<?php

namespace Modules\Project\Services;

use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\TimeTracking\Models\TimeEntry;

class ProjectAllocationSyncService
{
    public function syncCurrentTeamAllocations(Project $project): void
    {
        $project->loadMissing('team');

        foreach ($project->team as $member) {
            $this->syncTeamMemberAllocation(
                $project,
                (int) $member->id,
                (int) ($member->pivot->allocation ?? 100),
            );
        }
    }

    public function removeAllocationsForUsers(Project $project, array $userIds): void
    {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($userIds === []) {
            return;
        }

        ProjectAllocation::query()
            ->where('project_id', $project->id)
            ->whereIn('user_id', $userIds)
            ->delete();
    }

    public function syncUsedHoursForProjectUser(int $projectId, int $userId): void
    {
        ProjectAllocation::query()
            ->where('project_id', $projectId)
            ->where('user_id', $userId)
            ->get()
            ->each(function (ProjectAllocation $allocation) use ($projectId, $userId) {
                $usedHours = (int) round(
                    (float) TimeEntry::query()
                        ->where('project_id', $projectId)
                        ->where('user_id', $userId)
                        ->whereBetween('entry_date', [
                            $allocation->start_date->toDateString(),
                            $allocation->end_date->toDateString(),
                        ])
                        ->sum('hours')
                );

                $allocation->update([
                    'used_hours' => $usedHours,
                ]);
            });
    }

    private function syncTeamMemberAllocation(Project $project, int $userId, int $percentage): void
    {
        [$startDate, $endDate] = $this->resolveProjectWindow($project);

        $existingAllocations = ProjectAllocation::query()
            ->where('project_id', $project->id)
            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->get();

        $allocation = $existingAllocations->first(function (ProjectAllocation $allocation) use ($startDate, $endDate) {
            return $allocation->start_date?->toDateString() === $startDate
                && $allocation->end_date?->toDateString() === $endDate;
        });

        if (! $allocation && $existingAllocations->count() === 1) {
            $allocation = $existingAllocations->first();
        }

        $payload = [
            'allocated_hours' => 0,
            'percentage' => $percentage,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        if ($allocation) {
            $allocation->update($payload);
        } else {
            ProjectAllocation::query()->create([
                'project_id' => $project->id,
                'user_id' => $userId,
                'used_hours' => 0,
                'notes' => null,
                ...$payload,
            ]);
        }

        $this->syncUsedHoursForProjectUser($project->id, $userId);
    }

    private function resolveProjectWindow(Project $project): array
    {
        $startDate = $project->start_date?->toDateString() ?? now()->toDateString();
        $endDate = $project->end_date?->toDateString() ?? $startDate;

        if ($endDate < $startDate) {
            $endDate = $startDate;
        }

        return [$startDate, $endDate];
    }
}
