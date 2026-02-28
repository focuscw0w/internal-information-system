<?php

namespace Modules\Project\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Enums\ProjectStatus;
use Modules\Project\Enums\ProjectWorkload;
use Modules\Project\Models\Project;

class ProjectTestUserSeeder extends Seeder
{
    public function run(): void
    {
        // =====================================================================
        // USERS
        // =====================================================================

        $owner = User::firstOrCreate(
            ['email' => 'owner@test.com'],
            [
                'name' => 'Peter Novák (Owner)',
                'password' => Hash::make('password'),
            ]
        );

        $memberFull = User::firstOrCreate(
            ['email' => 'member.full@test.com'],
            [
                'name' => 'Jana Kováčová (Full access)',
                'password' => Hash::make('password'),
            ]
        );

        $memberReadOnly = User::firstOrCreate(
            ['email' => 'member.readonly@test.com'],
            [
                'name' => 'Tomáš Horváth (Read only)',
                'password' => Hash::make('password'),
            ]
        );

        $outsider = User::firstOrCreate(
            ['email' => 'outsider@test.com'],
            [
                'name' => 'Milan Free (Outsider)',
                'password' => Hash::make('password'),
            ]
        );

        // =====================================================================
        // PROJECT
        // =====================================================================

        /** @var Project $project */
        $project = Project::firstOrCreate(
            ['name' => 'Demo projekt'],
            [
                'description' => 'Testovací projekt pre vývoj a demo účely.',
                'status' => ProjectStatus::ACTIVE->value,
                'workload' => ProjectWorkload::MEDIUM->value,
                'start_date' => now(),
                'end_date' => now()->addMonths(3),
                'progress' => 0,
                'capacity_used' => 0,
                'capacity_available' => 100,
                'tasks_total' => 0,
                'tasks_completed' => 0,
                'owner_id' => $owner->id,
            ]
        );

        // =====================================================================
        // TEAM – assigning members with permissions
        // =====================================================================

        // If the member is already in the team, update - otherwise add
        $existingIds = $project->team()->pluck('users.id')->toArray();

        // Full access – all permissions except delete
        if (!in_array($memberFull->id, $existingIds)) {
            $project->team()->attach($memberFull->id, [
                'permissions' => json_encode([
                    ProjectPermission::VIEW_PROJECT->value,
                    ProjectPermission::EDIT_PROJECT->value,
                    ProjectPermission::VIEW_TASKS->value,
                    ProjectPermission::CREATE_TASKS->value,
                    ProjectPermission::EDIT_TASKS->value,
                    ProjectPermission::ASSIGN_TASKS->value,
                    ProjectPermission::DELETE_TASKS->value,
                    ProjectPermission::VIEW_TEAM->value,
                    ProjectPermission::MANAGE_TEAM->value,
                ]),
                'allocation' => 100,
            ]);
        }

        // Read only – only view permissions
        if (!in_array($memberReadOnly->id, $existingIds)) {
            $project->team()->attach($memberReadOnly->id, [
                'permissions' => json_encode([
                    ProjectPermission::VIEW_PROJECT->value,
                    ProjectPermission::VIEW_TASKS->value,
                    ProjectPermission::VIEW_TEAM->value,
                ]),
                'allocation' => 50,
            ]);
        }

        // =====================================================================
        // OUTPUT
        // =====================================================================

        $this->command->info('');
        $this->command->info('✅ ProjectTestUserSeeder completed');
        $this->command->info('');
        $this->command->table(
            ['Rola', 'Email', 'Heslo', 'Permissions'],
            [
                ['Owner', 'owner@test.com', 'password', 'all (automatically)'],
                ['Full access', 'member.full@test.com', 'password', 'view, edit, tasks, team'],
                ['Read only', 'member.readonly@test.com', 'password', 'view project, view tasks, view team'],
                ['Outsider', 'outsider@test.com', 'password', 'none (not in the team)'],
            ]
        );
        $this->command->info('');
    }
}
