<?php

namespace Modules\User\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\User\Contracts\PermissionRegistryInterface;
use Modules\User\Enums\UserPermission;
use Tests\TestCase;

class PermissionRegistryIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_module_service_providers_register_their_public_permissions(): void
    {
        $registry = app(PermissionRegistryInterface::class);

        $this->assertEqualsCanonicalizing([
            UserPermission::USERS_VIEW->value,
            ProjectGlobalPermission::PROJECTS_CREATE->value,
            ProjectGlobalPermission::PROJECTS_VIEW_ALL->value,
            CapacityPermission::CAPACITY_MANAGE->value,
        ], $registry->all());
    }

    public function test_registered_permissions_are_grouped_for_the_frontend(): void
    {
        $groups = app(PermissionRegistryInterface::class)->groupedForFrontend();

        $this->assertArrayHasKey('Používatelia', $groups);
        $this->assertArrayHasKey('Projekty', $groups);
        $this->assertArrayHasKey('Kapacity', $groups);

        $values = collect($groups)->flatten(1)->pluck('value')->all();

        $this->assertContains(UserPermission::USERS_VIEW->value, $values);
        $this->assertContains(ProjectGlobalPermission::PROJECTS_CREATE->value, $values);
        $this->assertContains(ProjectGlobalPermission::PROJECTS_VIEW_ALL->value, $values);
        $this->assertContains(CapacityPermission::CAPACITY_MANAGE->value, $values);
    }
}
