<?php

namespace Modules\User\Database\Seeders;

use App\Enums\PermissionEnum;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\User\Models\User;

class UserTestSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin Systému',
                'password' => Hash::make('password'),
            ]
        );

        $admin->syncPermissions(PermissionEnum::all());

        $this->command->info('');
        $this->command->info('✅ UserTestSeeder completed');
        $this->command->table(
            ['Rola', 'Email', 'Heslo', 'Permissions'],
            [
                ['Admin', 'admin@test.com', 'password', implode(', ', PermissionEnum::all())],
            ]
        );
        $this->command->info('');
    }
}
