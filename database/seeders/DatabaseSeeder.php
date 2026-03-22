<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\User\Database\Seeders\UserDatabaseSeeder;
use Modules\Project\Database\Seeders\ProjectDatabaseSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call([
            PermissionSeeder::class,
            UserDatabaseSeeder::class,
            ProjectDatabaseSeeder::class,
        ]);

    }
}
