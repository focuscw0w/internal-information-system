<?php

namespace Modules\User\Services;

use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Models\User;

class UserService implements UserServiceInterface
{
    /**
     * Create a new user and assign permissions
     */
    public function createUser(array $data): void
    {
        $user = User::create($data);

        if (! empty($data['permissions'])) {
            $user->syncPermissions($data['permissions']);
        }
    }

    /**
     * Update user information and permissions
     */
    public function updateUser(User $user, array $data): void
    {
        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (! empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $user->update($updateData);
        $user->syncPermissions($data['permissions'] ?? []);
    }

    /**
     * Delete a user
     */
    public function deleteUser(User $user): void
    {
        $user->delete();
    }
}
