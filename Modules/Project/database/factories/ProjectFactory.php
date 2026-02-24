<?php

namespace Modules\Project\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Project\Models\Project;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(),
            'status' => 'active',
            'workload' => 'medium',
            'start_date' => now(),
            'end_date' => now()->addMonths(2),
            'actual_start_date' => null,
            'actual_end_date' => null,
            'progress' => 0,
            'capacity_used' => 0,
            'capacity_available' => 100,
            'tasks_total' => 0,
            'tasks_completed' => 0,
            'budget' => 0,
            'budget_spent' => 0,
            'owner_id' => User::factory(),
        ];
    }
}
