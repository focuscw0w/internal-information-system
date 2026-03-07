<?php

namespace Modules\Project\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Project\Models\Task;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'project_id' => ProjectFactory::new(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'status' => 'todo',
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'estimated_hours' => $this->faker->randomFloat(0, 1, 100),
            'actual_hours' => 0,
            'due_date' => $this->faker->dateTimeBetween('now', '+30 days'),
        ];
    }
}
