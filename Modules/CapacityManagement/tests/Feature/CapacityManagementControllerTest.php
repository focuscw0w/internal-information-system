<?php

namespace Modules\CapacityManagement\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CapacityManagementControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    #[Test]
    public function guest_cannot_access_capacity_dashboard(): void
    {
        $response = $this->get('/capacity-management');

        $response->assertRedirect('/login');
    }

    #[Test]
    public function authenticated_user_can_access_capacity_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/capacity-management');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('CapacityManagement/Index', false));
    }

    #[Test]
    public function authenticated_user_can_update_weekly_capacity(): void
    {
        $authUser = User::factory()->create();
        $targetUser = User::factory()->create();

        $response = $this->actingAs($authUser)
            ->patch("/capacity-management/users/{$targetUser->id}/capacity", [
                'weekly_capacity_hours' => 38,
            ]);

        $response->assertRedirect('/capacity-management');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $targetUser->id,
            'weekly_capacity_hours' => 38,
        ]);
    }

    #[Test]
    public function update_capacity_validates_input_range(): void
    {
        $authUser = User::factory()->create();
        $targetUser = User::factory()->create();

        EmployeeCapacity::create([
            'user_id' => $targetUser->id,
            'weekly_capacity_hours' => 40,
        ]);

        $response = $this->actingAs($authUser)
            ->from('/capacity-management')
            ->patch("/capacity-management/users/{$targetUser->id}/capacity", [
                'weekly_capacity_hours' => 0,
            ]);

        $response->assertRedirect('/capacity-management');
        $response->assertSessionHasErrors('weekly_capacity_hours');

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $targetUser->id,
            'weekly_capacity_hours' => 40,
        ]);
    }
}
