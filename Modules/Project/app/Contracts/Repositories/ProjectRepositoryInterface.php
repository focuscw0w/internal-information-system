<?php

namespace Modules\Project\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

interface ProjectRepositoryInterface
{
    public function visibleTo(User $user, array $filters = []): Collection;

    public function findWithDetails(int $id): ?Project;

    public function find(int $id): ?Project;

    public function findOrFail(int $id): Project;

    public function create(array $data): Project;

    public function update(Project $project, array $data): bool;

    public function delete(Project $project): bool;

    public function fresh(Project $project, array $relations = []): Project;

    public function statistics(): array;

    public function byStatus(string $status): Collection;

    public function overdue(): Collection;

    public function forUserWithSummaryRelations(int $userId): Collection;

    public function activeWithIncompleteTasks(): Collection;

    public function allWithTeam(): Collection;

    public function withTeamForUser(int $userId): Collection;

    public function visibleProjectIds(User $user): array;

    public function latestVisibleForTaskActions(User $user, ?string $nameLike, int $limit): Collection;

    public function searchVisible(User $user, string $like, int $limit): Collection;
}
