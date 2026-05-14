<?php

namespace Modules\User\Contracts;

interface PermissionRegistryInterface
{
    /**
     * Register a permission enum class. Must be a BackedEnum implementing PermissionEnumInterface.
     *
     * @param  class-string  $enumClass
     */
    public function register(string $enumClass): void;

    /**
     * Return all registered permission values across modules.
     *
     * @return array<int, string>
     */
    public function all(): array;

    /**
     * Return permissions grouped by group() for frontend (UI) consumption.
     *
     * @return array<string, array<int, array{value: string, label: string, description: string}>>
     */
    public function groupedForFrontend(): array;

    /**
     * Resolve a permission value back to the enum case, or null if not registered.
     */
    public function find(string $value): ?PermissionEnumInterface;
}
