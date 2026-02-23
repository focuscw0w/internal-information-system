<?php

namespace Modules\Project\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Modules\Project\Models\Project;

class ProjectTestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testUser = User::firstOrCreate(
            ['email' => 'test@test.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
            ]
        );

        echo "✅ Test user vytvorený:\n";
        echo "   Email: test@test.com\n";
        echo "   Heslo: password\n\n";

        $project = Project::firstOrCreate(
            ['name' => 'Testovací projekt'],
            [
                'description' => 'Projekt pre testovanie permissions',
                'status' => 'active',
                'workload' => 'medium',
                'start_date' => now(),
                'end_date' => now()->addMonths(3),
                'progress' => 25,
                'capacity_used' => 60,
                'capacity_available' => 40,
                'tasks_total' => 20,
                'tasks_completed' => 5,
                'budget' => 50000,
                'budget_spent' => 12500,
                'owner_id' => $testUser->id,
            ]
        );

        echo "✅ Testovací projekt vytvorený: {$project->name}\n\n";

        $allPermissions = [
            'view_project',
            'edit_project',
            'delete_project',

            'view_team',
            'manage_team',

            'view_tasks',
            'create_tasks',
            'edit_tasks',
            'delete_tasks',
            'assign_tasks',

            'view_budget',
            'edit_budget',

            'export_data',
        ];

        if (!$project->team()->where('user_id', $testUser->id)->exists()) {
            $project->addTeamMember(
                userId: $testUser->id,
                permissions: $allPermissions,
                allocation: 100,
                hourlyRate: 75.00
            );

            echo "✅ Test user pridaný do tímu s ADMIN permissions\n";
        } else {
            $project->updateTeamMemberPermissions($testUser->id, $allPermissions);
            echo "✅ Test user permissions aktualizované na ADMIN\n";
        }

        echo "\n=================================\n";
        echo "🎯 PRIHLÁSENIE:\n";
        echo "   Email: test@test.com\n";
        echo "   Heslo: password\n";
        echo "=================================\n";

        // Voliteľne: Vytvoríme ešte pár projektov pre testovanie
        $this->createAdditionalProjects($testUser);
    }

    /**
     * Vytvorí dodatočné projekty pre testovanie
     */
    private function createAdditionalProjects(User $testUser): void
    {
        $projects = [
            [
                'name' => 'E-commerce redesign',
                'status' => 'planning',
                'workload' => 'high',
                'permissions' => ['view_project', 'edit_project', 'view_tasks', 'create_tasks', 'edit_tasks', 'manage_team'],
            ],
            [
                'name' => 'Mobile App Development',
                'status' => 'active',
                'workload' => 'high',
                'permissions' => ['view_project', 'view_tasks', 'create_tasks', 'edit_tasks'], // Developer role
            ],
            [
                'name' => 'Website Maintenance',
                'status' => 'on_hold',
                'workload' => 'low',
                'permissions' => ['view_project', 'view_tasks'], // Viewer role
            ],
        ];

        foreach ($projects as $data) {
            $project = Project::firstOrCreate(
                ['name' => $data['name']],
                [
                    'description' => 'Automaticky vytvorený testovací projekt',
                    'status' => $data['status'],
                    'workload' => $data['workload'],
                    'start_date' => now()->subDays(rand(1, 30)),
                    'end_date' => now()->addDays(rand(30, 90)),
                    'progress' => rand(0, 100),
                    'capacity_used' => rand(40, 90),
                    'capacity_available' => rand(10, 60),
                    'tasks_total' => rand(10, 50),
                    'tasks_completed' => rand(0, 20),
                    'budget' => rand(10000, 100000),
                    'budget_spent' => rand(5000, 50000),
                    'owner_id' => 1,
                ]
            );

            if (!$project->team()->where('user_id', $testUser->id)->exists()) {
                $project->addTeamMember(
                    userId: $testUser->id,
                    permissions: $data['permissions'],
                    allocation: rand(50, 100)
                );
            }
        }

        echo "\n✅ Vytvorené 3 dodatočné projekty s rôznymi permissions\n";
    }
}
