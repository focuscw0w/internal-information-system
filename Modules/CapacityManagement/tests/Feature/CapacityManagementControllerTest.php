<?php

namespace Modules\CapacityManagement\Tests\Feature;

use App\Enums\PermissionEnum;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CapacityManagementControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);

        $this->manager = User::factory()->create();
        $this->manager->givePermissionTo(PermissionEnum::CAPACITY_MANAGE->value);

        $this->regularUser = User::factory()->create();
    }

    // ── INDEX ────────────────────────────────────────────────

    #[Test]
    public function guest_cannot_access_capacity_dashboard(): void
    {
        $response = $this->get('/capacity-management');

        $response->assertRedirect('/login');
    }

    #[Test]
    public function regular_user_cannot_access_capacity_dashboard(): void
    {
        $response = $this->actingAs($this->regularUser)->get('/capacity-management');

        $response->assertForbidden();
    }

    #[Test]
    public function admin_can_access_capacity_dashboard_without_explicit_permission(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->get('/capacity-management');

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('CapacityManagement/Index', false)
                ->where('can_manage', true)
        );
    }

    #[Test]
    public function dashboard_passes_can_manage_true_for_manager(): void
    {
        $response = $this->actingAs($this->manager)->get('/capacity-management');

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('CapacityManagement/Index', false)
                ->where('can_manage', true)
        );
    }

    #[Test]
    public function dashboard_contains_expected_data_keys(): void
    {
        $response = $this->actingAs($this->manager)->get('/capacity-management');

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('CapacityManagement/Index', false)
                ->has('dashboard.people')
                ->has('dashboard.alerts')
                ->has('dashboard.free_people')
                ->has('dashboard.weekly_overview')
                ->has('dashboard.monthly_overview')
                ->has('dashboard.prediction')
                ->has('dashboard.history')
        );
    }

    // ── UPDATE CAPACITY ──────────────────────────────────────

    #[Test]
    public function manager_can_update_weekly_capacity(): void
    {
        $target = User::factory()->create();

        $response = $this->actingAs($this->manager)
            ->patch("/capacity-management/users/{$target->id}/capacity", [
                'weekly_capacity_hours' => 38,
            ]);

        $response->assertRedirect('/capacity-management');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $target->id,
            'weekly_capacity_hours' => 38,
        ]);
    }

    #[Test]
    public function regular_user_cannot_update_weekly_capacity(): void
    {
        $target = User::factory()->create();

        $response = $this->actingAs($this->regularUser)
            ->patch("/capacity-management/users/{$target->id}/capacity", [
                'weekly_capacity_hours' => 38,
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('employee_capacities', ['user_id' => $target->id]);
    }

    #[Test]
    public function guest_cannot_update_weekly_capacity(): void
    {
        $target = User::factory()->create();

        $response = $this->patch("/capacity-management/users/{$target->id}/capacity", [
            'weekly_capacity_hours' => 38,
        ]);

        $response->assertRedirect('/login');
    }

    #[Test]
    public function update_capacity_rejects_zero_hours(): void
    {
        $target = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $target->id, 'weekly_capacity_hours' => 40]);

        $response = $this->actingAs($this->manager)
            ->from('/capacity-management')
            ->patch("/capacity-management/users/{$target->id}/capacity", [
                'weekly_capacity_hours' => 0,
            ]);

        $response->assertRedirect('/capacity-management');
        $response->assertSessionHasErrors('weekly_capacity_hours');

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $target->id,
            'weekly_capacity_hours' => 40,
        ]);
    }

    #[Test]
    public function update_capacity_rejects_hours_above_100(): void
    {
        $target = User::factory()->create();

        $response = $this->actingAs($this->manager)
            ->from('/capacity-management')
            ->patch("/capacity-management/users/{$target->id}/capacity", [
                'weekly_capacity_hours' => 101,
            ]);

        $response->assertSessionHasErrors('weekly_capacity_hours');
    }

    #[Test]
    public function update_capacity_accepts_boundary_values(): void
    {
        $target = User::factory()->create();

        $this->actingAs($this->manager)
            ->patch("/capacity-management/users/{$target->id}/capacity", ['weekly_capacity_hours' => 1]);
        $this->assertDatabaseHas('employee_capacities', ['user_id' => $target->id, 'weekly_capacity_hours' => 1]);

        $this->actingAs($this->manager)
            ->patch("/capacity-management/users/{$target->id}/capacity", ['weekly_capacity_hours' => 100]);
        $this->assertDatabaseHas('employee_capacities', ['user_id' => $target->id, 'weekly_capacity_hours' => 100]);
    }

    #[Test]
    public function update_capacity_creates_record_when_none_exists(): void
    {
        $target = User::factory()->create();
        $this->assertDatabaseMissing('employee_capacities', ['user_id' => $target->id]);

        $this->actingAs($this->manager)
            ->patch("/capacity-management/users/{$target->id}/capacity", ['weekly_capacity_hours' => 32]);

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $target->id,
            'weekly_capacity_hours' => 32,
        ]);
    }

    #[Test]
    public function update_capacity_updates_existing_record(): void
    {
        $target = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $target->id, 'weekly_capacity_hours' => 40]);

        $this->actingAs($this->manager)
            ->patch("/capacity-management/users/{$target->id}/capacity", ['weekly_capacity_hours' => 24]);

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $target->id,
            'weekly_capacity_hours' => 24,
        ]);
        $this->assertDatabaseCount('employee_capacities', 1);
    }

    #[Test]
    public function update_capacity_rejects_non_integer_input(): void
    {
        $target = User::factory()->create();

        $response = $this->actingAs($this->manager)
            ->from('/capacity-management')
            ->patch("/capacity-management/users/{$target->id}/capacity", [
                'weekly_capacity_hours' => 'abc',
            ]);

        $response->assertSessionHasErrors('weekly_capacity_hours');
    }
}
