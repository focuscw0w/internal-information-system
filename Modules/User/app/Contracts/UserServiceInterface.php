<?php

namespace Modules\User\Contracts;

use Modules\User\Models\User;

interface UserServiceInterface {
    public function createUser(array $data): void;
    
    public function updateUser(User $user, array $data): void;
 
    public function deleteUser(User $user): void;
}