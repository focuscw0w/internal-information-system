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
}
