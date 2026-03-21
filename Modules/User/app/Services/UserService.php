<?php

namespace Modules\User\Services;

use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Models\User;

class UserService implements UserServiceInterface
{
    public function createUser(array $data): void
    {
        $user = User::create($data);

        if (! empty($data['permissions'])) {
            $user->syncPermissions($data['permissions']);
        }
    }

    public function updateUser(User $user, array $data): void
    {
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        $user->syncPermissions($data['permissions'] ?? []);
    }

    public function deleteUser(User $user): void
    {
        $user->delete();
    }
}
