<?php

namespace Modules\TimeTracking\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;

class TimeEntryFactory extends Factory
{
    protected $model = TimeEntry::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'task_id' => Task::factory(),
            'user_id' => User::factory(),
            'entry_date' => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'hours' => $this->faker->randomFloat(2, 0.25, 8),
            'description' => $this->faker->optional(0.5)->sentence(),
        ];
    }
}
