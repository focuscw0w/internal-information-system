<?php

namespace Modules\TimeTracking\Tests\Unit;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Services\TimeEntryService;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TimeEntryServiceAggregatesTest extends TestCase
{
    use RefreshDatabase;

    private TimeEntryService $service;
    private User $user;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->project = Project::factory()->create(['owner_id' => $this->user->id]);
        $this->task = Task::factory()->create(['project_id' => $this->project->id]);
        $this->service = app(TimeEntryServiceInterface::class);
    }

    private function makeEntry(User $user, float $hours, string $date, ?Task $task = null): TimeEntry
    {
        return TimeEntry::factory()->create([
            'user_id' => $user->id,
            'project_id' => $this->project->id,
            'task_id' => ($task ?? $this->task)->id,
            'hours' => $hours,
            'entry_date' => $date,
        ]);
    }

    // =========================================================================
    // getUserSummary
    // =========================================================================

    #[Test]
    public function it_returns_correct_total_hours_this_week(): void
    {
        $this->makeEntry($this->user, 3, now()->startOfWeek()->addDay()->format('Y-m-d'));
        $this->makeEntry($this->user, 2, now()->startOfWeek()->addDays(2)->format('Y-m-d'));
        // Entry from last week — should not be counted
        $this->makeEntry($this->user, 5, now()->subWeek()->format('Y-m-d'));

        $summary = $this->service->getUserSummary($this->user);

        $this->assertEquals(5, $summary['total_hours_this_week']);
    }

    #[Test]
    public function it_returns_correct_total_hours_this_month(): void
    {
        $this->makeEntry($this->user, 4, now()->startOfMonth()->addDay()->format('Y-m-d'));
        $this->makeEntry($this->user, 6, now()->startOfMonth()->addDays(3)->format('Y-m-d'));
        // Entry from last month — should not be counted
        $this->makeEntry($this->user, 8, now()->subMonth()->format('Y-m-d'));

        $summary = $this->service->getUserSummary($this->user);

        $this->assertEquals(10, $summary['total_hours_this_month']);
    }

    #[Test]
    public function it_returns_zero_when_no_entries_exist(): void
    {
        $summary = $this->service->getUserSummary($this->user);

        $this->assertEquals(0, $summary['total_hours_this_week']);
        $this->assertEquals(0, $summary['total_hours_this_month']);
    }

    #[Test]
    public function it_limits_recent_entries_to_5(): void
    {
        for ($i = 0; $i < 7; $i++) {
            $this->makeEntry($this->user, 1, now()->subDays($i)->format('Y-m-d'));
        }

        $summary = $this->service->getUserSummary($this->user);

        $this->assertCount(5, $summary['recent_entries']);
    }

    #[Test]
    public function it_only_includes_entries_for_the_given_user(): void
    {
        $otherUser = User::factory()->create();

        $this->makeEntry($this->user, 3, now()->format('Y-m-d'));
        $this->makeEntry($otherUser, 10, now()->format('Y-m-d'));

        $summary = $this->service->getUserSummary($this->user);

        $this->assertEquals(3, $summary['total_hours_this_week']);
    }

    // =========================================================================
    // getTotalHoursPerUserInPeriod
    // =========================================================================

    #[Test]
    public function it_sums_hours_per_user_in_date_range(): void
    {
        $user2 = User::factory()->create();
        $from = Carbon::parse('2024-01-01');
        $to = Carbon::parse('2024-01-31');

        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 3,
            'entry_date' => '2024-01-10',
        ]);
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 2,
            'entry_date' => '2024-01-15',
        ]);
        TimeEntry::factory()->create([
            'user_id' => $user2->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 1,
            'entry_date' => '2024-01-20',
        ]);

        $result = $this->service->getTotalHoursPerUserInPeriod($from, $to);

        $this->assertEquals(5, $result[$this->user->id]);
        $this->assertEquals(1, $result[$user2->id]);
    }

    #[Test]
    public function it_excludes_entries_outside_date_range(): void
    {
        $from = Carbon::parse('2024-01-01');
        $to = Carbon::parse('2024-01-31');

        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 5,
            'entry_date' => '2024-02-10',
        ]);

        $result = $this->service->getTotalHoursPerUserInPeriod($from, $to);

        $this->assertEmpty($result);
    }

    #[Test]
    public function it_returns_empty_collection_when_no_entries_in_period(): void
    {
        $from = Carbon::parse('2020-01-01');
        $to = Carbon::parse('2020-01-31');

        $result = $this->service->getTotalHoursPerUserInPeriod($from, $to);

        $this->assertEmpty($result);
    }

    // =========================================================================
    // getHoursGroupedByWeekAndUser
    // =========================================================================

    #[Test]
    public function it_groups_entries_by_iso_week_key(): void
    {
        $from = Carbon::parse('2024-01-01');
        $to = Carbon::parse('2024-01-31');

        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 2,
            'entry_date' => '2024-01-03', // ISO week 1
        ]);
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 3,
            'entry_date' => '2024-01-15', // ISO week 3
        ]);

        $result = $this->service->getHoursGroupedByWeekAndUser($from, $to);

        $this->assertNotEmpty($result);
        foreach (array_keys($result) as $weekKey) {
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}$/', $weekKey);
        }
    }

    #[Test]
    public function it_sums_hours_per_user_within_the_same_week(): void
    {
        $from = Carbon::parse('2024-01-01');
        $to = Carbon::parse('2024-01-31');

        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 2,
            'entry_date' => '2024-01-08', // ISO week 2
        ]);
        TimeEntry::factory()->create([
            'user_id' => $this->user->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'hours' => 3,
            'entry_date' => '2024-01-09', // ISO week 2
        ]);

        $result = $this->service->getHoursGroupedByWeekAndUser($from, $to);

        $weekKey = Carbon::parse('2024-01-08')->format('o-W');
        $this->assertEquals(5.0, $result[$weekKey][$this->user->id]);
    }

    #[Test]
    public function it_returns_empty_array_when_no_entries(): void
    {
        $from = Carbon::parse('2020-01-01');
        $to = Carbon::parse('2020-01-31');

        $result = $this->service->getHoursGroupedByWeekAndUser($from, $to);

        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }
}
