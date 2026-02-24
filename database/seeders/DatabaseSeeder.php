<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Project\Database\Seeders\ProjectTestUserSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call([
            ProjectTestUserSeeder::class,
        ]);

        $this->call([
            PermissionSeeder::class
        ]);
    }
}
