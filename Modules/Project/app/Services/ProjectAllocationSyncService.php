<?php

namespace Modules\Project\Services;

use Carbon\Carbon;
use Modules\CapacityManagement\Contracts\CapacityReaderInterface;
use Modules\Project\Contracts\ProjectAllocationSyncInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\TimeTracking\Models\TimeEntry;

class ProjectAllocationSyncService implements ProjectAllocationSyncInterface
{
    public function __construct(private readonly CapacityReaderInterface $capacityReader) {}

    public function syncCurrentTeamAllocations(Project $project): void
    {
        $project->loadMissing('team');
        $teamUserIds = $project->team->pluck('id')->map(fn ($id) => (int) $id)->all();

        if ($teamUserIds === []) {
            ProjectAllocation::query()
                ->where('project_id', $project->id)
                ->delete();

            return;
        }

        ProjectAllocation::query()
            ->where('project_id', $project->id)
            ->whereNotIn('user_id', $teamUserIds)
            ->delete();

        $capacities = $this->capacityReader->getWeeklyCapacitiesForUsers($teamUserIds);

        foreach ($project->team as $member) {
            $memberId = (int) $member->id;
            $this->syncTeamMemberAllocation(
                $project,
                $memberId,
                (int) ($member->pivot->allocation ?? 100),
                $capacities[$memberId] ?? null,
            );
        }
    }

    public function syncAllocationsForUserProjects(int $userId): int
    {
        $projects = Project::query()
            ->whereHas('team', fn ($query) => $query->where('users.id', $userId))
            ->with('team')
            ->get();

        foreach ($projects as $project) {
            $member = $project->team->firstWhere('id', $userId);

            if ($member === null) {
                continue;
            }

            $this->syncTeamMemberAllocation(
                $project,
                $userId,
                (int) ($member->pivot->allocation ?? 100),
                $this->resolveUserWeeklyCapacity($userId),
            );
        }

        return $projects->count();
    }

    public function syncAllProjectAllocations(): int
    {
        $projects = Project::query()
            ->with('team')
            ->get();

        foreach ($projects as $project) {
            $this->syncCurrentTeamAllocations($project);
        }

        return $projects->count();
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

    private function syncTeamMemberAllocation(
        Project $project,
        int $userId,
        int $percentage,
        ?int $weeklyCapacityHours = null,
    ): void
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

        $weeklyCapacityHours ??= $this->resolveUserWeeklyCapacity($userId);

        $payload = [
            'allocated_hours' => $this->calculateAllocatedHours(
                $percentage,
                $weeklyCapacityHours,
                $startDate,
                $endDate,
            ),
            'percentage' => $percentage,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        if ($allocation) {
            $allocation->update($payload);
        } else {
            $allocation = ProjectAllocation::query()->create([
                'project_id' => $project->id,
                'user_id' => $userId,
                'used_hours' => 0,
                'notes' => null,
                ...$payload,
            ]);
        }

        ProjectAllocation::query()
            ->where('project_id', $project->id)
            ->where('user_id', $userId)
            ->whereKeyNot($allocation->id)
            ->delete();

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

    private function resolveUserWeeklyCapacity(int $userId): int
    {
        return $this->capacityReader->getWeeklyCapacityForUser($userId) ?? 40;
    }

    private function calculateAllocatedHours(
        int $percentage,
        int $weeklyCapacityHours,
        string $startDate,
        string $endDate,
    ): int {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();
        $overlapDays = max(1, $start->diffInDays($end->copy()->addDay()));

        return (int) round(($percentage / 100) * $weeklyCapacityHours * ($overlapDays / 7));
    }
}
