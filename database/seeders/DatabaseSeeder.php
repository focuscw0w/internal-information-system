<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Project\Database\Seeders\ProjectTestUserSeeder;
use Modules\User\Database\Seeders\UserDatabaseSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProjectTestUserSeeder::class,
            UserDatabaseSeeder::class,
        ]);
    }
}
