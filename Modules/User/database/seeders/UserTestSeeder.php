<?php

namespace Modules\User\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\User\Contracts\PermissionRegistryInterface;
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
                'is_admin' => true,
            ]
        );

        $admin->update(['is_admin' => true]);

        $allPermissions = app(PermissionRegistryInterface::class)->all();
        $admin->syncPermissions($allPermissions);

        $this->command->info('');
        $this->command->info('✅ UserTestSeeder completed');
        $this->command->table(
            ['Rola', 'Email', 'Heslo', 'Permissions'],
            [
                ['Admin', 'admin@test.com', 'password', implode(', ', $allPermissions)],
            ]
        );
        $this->command->info('');
    }
}
