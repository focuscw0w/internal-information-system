<?php

namespace Modules\Project\Contracts;

use Modules\User\Models\User;

interface SearchProviderInterface
{
    /**
     * Return search results contributed by this module.
     *
     * Result keys recognised by the orchestrator: actions, projects, tasks, comments, users.
     * Unknown keys are passed through verbatim.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function search(string $query, User $user, int $perGroup): array;
}
