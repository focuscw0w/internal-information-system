<?php

namespace Modules\TimeTracking\Tests\Unit;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Contracts\Repositories\TimeEntryRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeReportRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingProjectRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingTaskRepositoryInterface;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TimeTrackingRepositoriesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->project = Project::factory()->create(['owner_id' => $this->user->id]);
        $this->task = Task::factory()->create(['project_id' => $this->project->id]);
    }

    #[Test]
    public function time_entry_repository_handles_crud_project_filters_and_task_listing(): void
    {
        $repository = app(TimeEntryRepositoryInterface::class);
        $otherUser = User::factory()->create();
        $otherTask = Task::factory()->create(['project_id' => $this->project->id]);

        $entry = $repository->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-04',
            'hours' => 2.5,
            'description' => 'Initial',
        ]);
        $repository->create([
            'project_id' => $this->project->id,
            'task_id' => $otherTask->id,
            'user_id' => $otherUser->id,
            'entry_date' => '2026-03-06',
            'hours' => 1,
        ]);

        $this->assertTrue($repository->find($entry->id)->is($entry));
        $this->assertCount(1, $repository->getByProject($this->project->id, ['user_id' => $this->user->id]));
        $this->assertCount(1, $repository->getByProject($this->project->id, ['task_id' => $this->task->id]));
        $this->assertCount(2, $repository->getByProject($this->project->id, [
            'date_from' => '2026-03-01',
            'date_to' => '2026-03-10',
        ]));
        $this->assertCount(1, $repository->getByTask($this->task->id));

        $this->assertTrue($repository->update($entry, ['hours' => 3.5]));
        $this->assertSame(3.5, (float) $entry->refresh()->hours);
        $this->assertTrue($repository->delete($entry));
        $this->assertNull($repository->find($entry->id));
    }

    #[Test]
    public function time_entry_repository_returns_period_aggregates_and_week_grouping(): void
    {
        $repository = app(TimeEntryRepositoryInterface::class);
        $otherUser = User::factory()->create();

        $this->makeEntry($this->user, 2, '2026-03-02', TimeEntryStatusEnum::Approved->value);
        $this->makeEntry($this->user, 3, '2026-03-03', TimeEntryStatusEnum::Approved->value);
        $this->makeEntry($otherUser, 4, '2026-03-09', TimeEntryStatusEnum::Pending->value);

        $from = Carbon::parse('2026-03-01');
        $to = Carbon::parse('2026-03-31');
        $byUser = $repository->totalHoursPerUserInPeriod($from, $to);
        $byProject = $repository->totalHoursPerProjectInPeriod($from, $to, null, null, 'all');
        $weeks = $repository->hoursGroupedByWeekAndUser($from, $to);

        $this->assertSame(5.0, (float) $byUser[$this->user->id]);
        $this->assertSame(9.0, (float) $byProject[$this->project->id]);
        $this->assertSame(5.0, $weeks[Carbon::parse('2026-03-02')->format('o-W')][$this->user->id]);
    }

    #[Test]
    public function project_and_task_repositories_support_access_timer_and_validation_queries(): void
    {
        $projects = app(TimeTrackingProjectRepositoryInterface::class);
        $tasks = app(TimeTrackingTaskRepositoryInterface::class);
        $this->task->assignedUsers()->attach($this->user->id);

        $this->assertTrue($projects->find($this->project->id)->is($this->project));
        $this->assertTrue($projects->userIsParticipant($this->project->id, $this->user));
        $this->assertTrue($projects->hasManageableProjects($this->user));
        $this->assertContains($this->project->id, $projects->manageableProjectIds($this->user));
        $this->assertTrue($projects->timerProjectsForUser($this->user->id)->contains('id', $this->project->id));
        $this->assertTrue($tasks->find($this->task->id)->is($this->task));
        $this->assertTrue($tasks->assignedUserExists($this->task->id, $this->user->id));

        $tasks->updateActualHours($this->task->id, 7.25);

        $this->assertSame(7.25, (float) $this->task->refresh()->actual_hours);
    }

    #[Test]
    public function time_entry_repository_supports_approval_bulk_updates(): void
    {
        $repository = app(TimeEntryRepositoryInterface::class);
        $entry = $this->makeEntry($this->user, 2, '2026-03-02', TimeEntryStatusEnum::Pending->value);

        $this->assertTrue($repository->findWithProjectOrFail($entry->id)->relationLoaded('project'));
        $this->assertCount(1, $repository->findManyWithProject([$entry->id]));

        $repository->updateStatusForIds([$entry->id], [
            'status' => TimeEntryStatusEnum::Approved->value,
            'approved_by' => $this->user->id,
            'approved_at' => Carbon::parse('2026-03-03 10:00:00'),
            'rejection_reason' => null,
        ]);

        $this->assertSame(TimeEntryStatusEnum::Approved->value, $entry->refresh()->status);
    }

    #[Test]
    public function report_repository_returns_stats_exports_and_filter_users(): void
    {
        $reports = app(TimeReportRepositoryInterface::class);
        $this->makeEntry($this->user, 2, '2026-03-02', TimeEntryStatusEnum::Approved->value);
        $this->makeEntry($this->user, 3, '2026-03-03', TimeEntryStatusEnum::Pending->value);

        $from = Carbon::parse('2026-03-01');
        $to = Carbon::parse('2026-03-31');

        $this->assertSame(2, (int) $reports->userStats($from, $to, null, null, 'all')[$this->user->id]->entries_count);
        $this->assertSame(2, (int) $reports->projectStats($from, $to, null, null, 'all')[$this->project->id]->entries_count);
        $this->assertSame(5.0, (float) $reports->topContributors($from, $to, null, null, 'all')[$this->project->id][0]['hours']);
        $this->assertCount(2, $reports->timelineEntries($from, $to, null, null, 'all'));
        $this->assertCount(2, $reports->summaryExportEntries($from, $to, null, null, 'all'));
        $this->assertCount(2, $reports->detailExportEntries($from, $to, null, null, 'all'));
        $this->assertTrue($reports->usersByIds([$this->user->id])->has($this->user->id));
        $this->assertTrue($reports->filterUsers([$this->project->id])->contains('id', $this->user->id));
    }

    private function makeEntry(User $user, float $hours, string $date, string $status): TimeEntry
    {
        return TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $user->id,
            'entry_date' => $date,
            'hours' => $hours,
            'status' => $status,
        ]);
    }
}
