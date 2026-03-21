<?php

namespace Modules\User\Contracts;

interface UserServiceInterface {
    public function createUser(array $data): void;
}