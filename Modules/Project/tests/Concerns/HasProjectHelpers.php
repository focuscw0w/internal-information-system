<?php

namespace Modules\Project\Tests\Concerns;

use Modules\Project\Models\Project;
use Modules\User\Models\User;

trait HasProjectHelpers
{
    private function createProject(?User $owner = null): Project
    {
        $owner ??= User::factory()->create();

        return Project::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Test projekt',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addMonth(),
        ]);
    }

    private function attachMember(Project $project, User $user, array $permissions): void
    {
        $project->team()->attach($user->id, [
            'permissions' => json_encode($permissions),
            'allocation' => 100,
        ]);
    }
}
