<?php

namespace Modules\Project\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Project\Models\Project;

class ProjectFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Project::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'client' => $this->faker->company(),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['planned', 'active', 'on_hold', 'completed']),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'start_date' => $this->faker->date(),
            'due_date' => $this->faker->date(),
            'tags' => implode(',', $this->faker->words(3)),
        ];
    }
}

