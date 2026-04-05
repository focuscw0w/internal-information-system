<?php

namespace Modules\User\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\User\Models\User;

interface UserServiceInterface
{
    public function getAllUsers(): Collection;

    public function createUser(array $data): void;

    public function updateUser(User $user, array $data): void;

    public function deleteUser(User $user): void;
}