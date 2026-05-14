<?php

namespace Modules\User\Contracts;

interface PermissionEnumInterface
{
    public function label(): string;

    public function description(): string;

    public function group(): string;
}
