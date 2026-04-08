<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectModelTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
    }

    private function makeProject(array $overrides = []): Project
    {
        return Project::factory()->create(array_merge([
            'owner_id' => $this->owner->id,
        ], $overrides));
    }

    // =========================================================================
    // team_size accessor
    // =========================================================================

    #[Test]
    public function team_size_is_zero_when_no_team_members(): void
    {
        $project = $this->makeProject();

        $this->assertEquals(0, $project->team_size);
    }

    #[Test]
    public function team_size_is_correct_after_attaching_members(): void
    {
        $project = $this->makeProject();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $project->team()->attach($user1->id, ['permissions' => '[]', 'allocation' => 100]);
        $project->team()->attach($user2->id, ['permissions' => '[]', 'allocation' => 100]);

        $this->assertEquals(2, $project->fresh()->team_size);
    }

    // =========================================================================
    // is_overdue accessor
    // =========================================================================

    #[Test]
    public function is_overdue_is_true_when_end_date_is_past_and_not_completed(): void
    {
        $project = $this->makeProject([
            'end_date' => now()->subDay(),
            'status' => 'active',
        ]);

        $this->assertTrue($project->is_overdue);
    }

    #[Test]
    public function is_overdue_is_false_when_status_is_completed(): void
    {
        $project = $this->makeProject([
            'end_date' => now()->subDay(),
            'status' => 'completed',
        ]);

        $this->assertFalse($project->is_overdue);
    }

    #[Test]
    public function is_overdue_is_false_when_end_date_is_in_future(): void
    {
        $project = $this->makeProject([
            'end_date' => now()->addDay(),
            'status' => 'active',
        ]);

        $this->assertFalse($project->is_overdue);
    }

    // =========================================================================
    // days_remaining accessor
    // =========================================================================

    #[Test]
    public function days_remaining_returns_positive_integer_for_future_end_date(): void
    {
        $project = $this->makeProject(['end_date' => now()->addDays(10)]);

        $this->assertGreaterThan(0, $project->days_remaining);
    }

    #[Test]
    public function days_remaining_returns_zero_when_end_date_is_past(): void
    {
        $project = $this->makeProject(['end_date' => now()->subDays(5)]);

        $this->assertEquals(0, $project->days_remaining);
    }

    // =========================================================================
    // is_at_risk accessor
    // =========================================================================

    #[Test]
    public function is_at_risk_is_true_when_project_is_overdue(): void
    {
        $project = $this->makeProject([
            'end_date' => now()->subDay(),
            'status' => 'active',
        ]);

        $this->assertTrue($project->is_at_risk);
    }

    #[Test]
    public function is_at_risk_is_false_when_no_active_tasks(): void
    {
        $project = $this->makeProject(['end_date' => now()->addMonth()]);

        // No tasks at all
        $this->assertFalse($project->is_at_risk);
    }

    #[Test]
    public function is_at_risk_is_true_when_more_than_30_percent_of_active_tasks_are_at_risk(): void
    {
        $project = $this->makeProject(['end_date' => now()->addMonth()]);

        // 2 at-risk tasks (past due, not done) out of 4 active = 50%
        Task::factory()->count(2)->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'due_date' => now()->subDay(),
        ]);
        Task::factory()->count(2)->create([
            'project_id' => $project->id,
            'status' => 'in_progress',
            'due_date' => now()->addMonth(),
        ]);

        $this->assertTrue($project->fresh()->is_at_risk);
    }

    #[Test]
    public function is_at_risk_is_false_when_30_percent_or_fewer_tasks_are_at_risk(): void
    {
        $project = $this->makeProject(['end_date' => now()->addMonth()]);

        // 1 at-risk task out of 4 active = 25%
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'due_date' => now()->subDay(),
        ]);
        Task::factory()->count(3)->create([
            'project_id' => $project->id,
            'status' => 'in_progress',
            'due_date' => now()->addMonth(),
        ]);

        $this->assertFalse($project->fresh()->is_at_risk);
    }

    // =========================================================================
    // scopeActive
    // =========================================================================

    #[Test]
    public function scope_active_returns_only_active_projects(): void
    {
        $this->makeProject(['status' => 'active']);
        $this->makeProject(['status' => 'active']);
        $this->makeProject(['status' => 'completed']);

        $results = Project::active()->get();

        $this->assertCount(2, $results);
        foreach ($results as $project) {
            $this->assertEquals('active', $project->status);
        }
    }

    #[Test]
    public function scope_active_excludes_completed_projects(): void
    {
        $this->makeProject(['status' => 'completed']);

        $this->assertCount(0, Project::active()->get());
    }

    // =========================================================================
    // scopeForUser
    // =========================================================================

    #[Test]
    public function scope_for_user_returns_projects_where_user_is_owner(): void
    {
        $user = User::factory()->create();
        $this->makeProject(['owner_id' => $user->id]);

        $results = Project::forUser($user->id)->get();

        $this->assertCount(1, $results);
    }

    #[Test]
    public function scope_for_user_returns_projects_where_user_is_team_member(): void
    {
        $user = User::factory()->create();
        $project = $this->makeProject();
        $project->team()->attach($user->id, ['permissions' => '[]', 'allocation' => 100]);

        $results = Project::forUser($user->id)->get();

        $this->assertCount(1, $results);
    }

    #[Test]
    public function scope_for_user_does_not_return_unrelated_projects(): void
    {
        $user = User::factory()->create();
        $this->makeProject(); // owned by $this->owner, not by $user

        $results = Project::forUser($user->id)->get();

        $this->assertCount(0, $results);
    }
}
