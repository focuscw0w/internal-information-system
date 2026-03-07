<?php

namespace Modules\TimeTracking\Tests\Unit;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Illuminate\Support\Carbon;

class TimeEntryModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_belongs_to_a_project(): void
    {
        $entry = TimeEntry::factory()->create();

        $this->assertInstanceOf(Project::class, $entry->project);
    }

    #[Test]
    public function it_belongs_to_a_task(): void
    {
        $entry = TimeEntry::factory()->create();

        $this->assertInstanceOf(Task::class, $entry->task);
    }

    #[Test]
    public function it_belongs_to_a_user(): void
    {
        $entry = TimeEntry::factory()->create();

        $this->assertInstanceOf(User::class, $entry->user);
    }

    #[Test]
    public function it_casts_entry_date_to_date(): void
    {
        $entry = TimeEntry::factory()->create(['entry_date' => '2026-03-07']);

        $this->assertInstanceOf(Carbon::class, $entry->entry_date);
    }

    #[Test]
    public function it_casts_hours_to_decimal(): void
    {
        $entry = TimeEntry::factory()->create(['hours' => 2.5]);

        $this->assertEquals('2.50', $entry->hours);
    }

    #[Test]
    public function it_has_fillable_attributes(): void
    {
        $entry = TimeEntry::factory()->create([
            'entry_date' => '2026-03-07',
            'hours' => 3.5,
            'description' => 'Test description',
        ]);

        $this->assertEquals('2026-03-07', $entry->entry_date->format('Y-m-d'));
        $this->assertEquals('3.50', $entry->hours);
        $this->assertEquals('Test description', $entry->description);
    }
}
