<?php

namespace Modules\User\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Models\User;

class UserService implements UserServiceInterface
{
    /**
     * Get all users for capacity and assignment lookups.
     */
    public function getAllUsers(): Collection
    {
        return User::query()->orderBy('name')->get(['id', 'name', 'email']);
    }

    /**
     * Create a new user and assign permissions.
     */
    public function createUser(array $data): void
    {
        $user = User::create($data);

        if (! empty($data['permissions'])) {
            $user->syncPermissions($data['permissions']);
        }
    }

    /**
     * Update user information and permissions.
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

        // Admin permissions cannot be changed via the UI
        if (! $user->is_admin) {
            $user->syncPermissions($data['permissions'] ?? []);
        }
    }

    /**
     * Delete a user.
     */
    public function deleteUser(User $user): void
    {
        if ($user->is_admin) {
            abort(403, 'Admin nemôže byť zmazaný.');
        }

        $user->delete();
    }
}
