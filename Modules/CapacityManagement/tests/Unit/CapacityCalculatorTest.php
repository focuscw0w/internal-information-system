<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\CapacityManagement\DTO\CapacityInputs;
use Modules\CapacityManagement\Services\CapacityCalculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Pure unit tests for CapacityCalculator — no database, no Eloquent, no Laravel boot.
 * All inputs are built from plain objects/arrays.
 */
class CapacityCalculatorTest extends TestCase
{
    private CapacityCalculator $calculator;
    private Carbon $now;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new CapacityCalculator;
        $this->now = Carbon::parse('2026-04-01 10:00:00');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(int $id, string $name = 'User', string $email = ''): object
    {
        return (object) ['id' => $id, 'name' => $name, 'email' => $email ?: "{$name}@test.com"];
    }

    private function makeProject(int $id, string $name, ?string $endDate, array $tasks = []): object
    {
        return (object) [
            'id' => $id,
            'name' => $name,
            'end_date' => $endDate ? Carbon::parse($endDate) : null,
            'tasks' => collect($tasks),
        ];
    }

    private function makeTask(int $estimated, int $actual, string $status = 'todo'): object
    {
        return (object) ['estimated_hours' => $estimated, 'actual_hours' => $actual, 'status' => $status];
    }

    private function makeInputs(array $override = []): CapacityInputs
    {
        return new CapacityInputs(
            users: $override['users'] ?? collect(),
            capacitiesMap: $override['capacitiesMap'] ?? [],
            weeklyByUser: $override['weeklyByUser'] ?? [],
            monthlyByUser: $override['monthlyByUser'] ?? [],
            weeksInMonth: $override['weeksInMonth'] ?? 4,
            periods: $override['periods'] ?? [
                'start_of_week' => $this->now->copy()->startOfWeek(),
                'end_of_week' => $this->now->copy()->endOfWeek(),
                'start_of_month' => $this->now->copy()->startOfMonth(),
                'end_of_month' => $this->now->copy()->endOfMonth(),
            ],
            activeProjects: $override['activeProjects'] ?? collect(),
            historyByYwAndUser: $override['historyByYwAndUser'] ?? [],
            now: $override['now'] ?? $this->now,
        );
    }

    // ── Empty inputs ──────────────────────────────────────────────────────────

    #[Test]
    public function empty_inputs_produce_empty_people_and_zero_overviews(): void
    {
        $result = $this->calculator->compute($this->makeInputs());

        $this->assertEmpty($result['people']);
        $this->assertEmpty($result['alerts']);
        $this->assertEmpty($result['free_people']);
        $this->assertEquals(0, $result['weekly_overview']['capacity_hours']);
        $this->assertEquals(0, $result['weekly_overview']['utilization']);
        $this->assertCount(12, $result['history']);
    }

    // ── Utilization & status ──────────────────────────────────────────────────

    #[Test]
    public function user_at_120_percent_is_red_and_in_alerts(): void
    {
        $user = $this->makeUser(1, 'Overloaded');

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$user]),
            'capacitiesMap' => [1 => 40],
            'weeklyByUser' => [1 => 48.0],   // 48/40 = 120%
        ]));

        $person = $result['people'][0];
        $this->assertEquals(120.0, $person['weekly_utilization']);
        $this->assertEquals('red', $person['status']);
        $this->assertTrue($person['is_over_capacity']);
        $this->assertCount(1, $result['alerts']);
        $this->assertEquals(1, $result['alerts'][0]['id']);
    }

    #[Test]
    public function utilization_below_80_is_green_and_in_free_people(): void
    {
        $user = $this->makeUser(1, 'Free');

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$user]),
            'capacitiesMap' => [1 => 40],
            'weeklyByUser' => [1 => 20.0],   // 50%
        ]));

        $this->assertEquals('green', $result['people'][0]['status']);
        $this->assertCount(1, $result['free_people']);
        $this->assertEmpty($result['alerts']);
    }

    #[Test]
    public function utilization_at_exactly_80_is_orange_and_not_in_free_people(): void
    {
        $user = $this->makeUser(1);

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$user]),
            'capacitiesMap' => [1 => 40],
            'weeklyByUser' => [1 => 32.0],   // 80%
        ]));

        $this->assertEquals('orange', $result['people'][0]['status']);
        $this->assertEmpty($result['free_people']);
    }

    #[Test]
    public function free_people_sorted_by_free_capacity_descending(): void
    {
        $u1 = $this->makeUser(1, 'A');
        $u2 = $this->makeUser(2, 'B');

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$u1, $u2]),
            'capacitiesMap' => [1 => 40, 2 => 40],
            'weeklyByUser' => [1 => 30.0, 2 => 10.0],  // A: 10h free, B: 30h free
        ]));

        $this->assertEquals('B', $result['free_people'][0]['name']);
        $this->assertEquals('A', $result['free_people'][1]['name']);
    }

    // ── Overview ──────────────────────────────────────────────────────────────

    #[Test]
    public function team_overview_sums_all_users(): void
    {
        $u1 = $this->makeUser(1);
        $u2 = $this->makeUser(2);

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$u1, $u2]),
            'capacitiesMap' => [1 => 40, 2 => 40],
            'weeklyByUser' => [1 => 20.0, 2 => 10.0],
        ]));

        $this->assertEquals(80, $result['weekly_overview']['capacity_hours']);
        $this->assertEquals(30.0, $result['weekly_overview']['load_hours']);
        $this->assertEquals(37.5, $result['weekly_overview']['utilization']);
    }

    // ── Prediction ────────────────────────────────────────────────────────────

    #[Test]
    public function prediction_with_no_projects_shows_zero_and_can_finish(): void
    {
        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$this->makeUser(1)]),
            'capacitiesMap' => [1 => 40],
        ]));

        $this->assertEquals(0.0, $result['prediction']['remaining_project_hours']);
        $this->assertTrue($result['prediction']['can_finish']);
        $this->assertEmpty($result['prediction']['projects']);
    }

    #[Test]
    public function prediction_computes_remaining_hours_from_tasks(): void
    {
        $project = $this->makeProject(1, 'Alpha', '2026-06-01', [
            $this->makeTask(100, 20),   // 80h remaining
            $this->makeTask(50, 50),    // 0h remaining
        ]);

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$this->makeUser(1)]),
            'capacitiesMap' => [1 => 40],
            'activeProjects' => collect([$project]),
        ]));

        $this->assertEquals(80.0, $result['prediction']['remaining_project_hours']);
    }

    #[Test]
    public function prediction_can_finish_is_false_when_remaining_exceeds_available(): void
    {
        // 40h/week * 4 weeks = 160h available, 200h remaining
        $project = $this->makeProject(1, 'Alpha', '2026-06-01', [
            $this->makeTask(200, 0),
        ]);

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$this->makeUser(1)]),
            'capacitiesMap' => [1 => 40],
            'activeProjects' => collect([$project]),
        ]));

        $this->assertFalse($result['prediction']['can_finish']);
        $this->assertLessThan(100, $result['prediction']['confidence']);
    }

    #[Test]
    public function prediction_marks_overdue_project(): void
    {
        $project = $this->makeProject(1, 'Late', '2026-03-01', [
            $this->makeTask(10, 0),
        ]);

        $result = $this->calculator->compute($this->makeInputs([
            'activeProjects' => collect([$project]),
        ]));

        $projectResult = collect($result['prediction']['projects'])->firstWhere('id', 1);
        $this->assertTrue($projectResult['is_overdue']);
        $this->assertEquals(0, $projectResult['days_remaining']);
    }

    #[Test]
    public function prediction_shows_days_remaining_for_future_project(): void
    {
        $project = $this->makeProject(1, 'Future', '2026-04-11', [
            $this->makeTask(5, 0),
        ]);

        $result = $this->calculator->compute($this->makeInputs([
            'activeProjects' => collect([$project]),
            'now' => Carbon::parse('2026-04-01'),
        ]));

        $projectResult = collect($result['prediction']['projects'])->firstWhere('id', 1);
        $this->assertFalse($projectResult['is_overdue']);
        $this->assertGreaterThan(0, $projectResult['days_remaining']);
    }

    // ── History ───────────────────────────────────────────────────────────────

    #[Test]
    public function history_always_has_12_weeks(): void
    {
        $result = $this->calculator->compute($this->makeInputs());

        $this->assertCount(12, $result['history']);
    }

    #[Test]
    public function history_last_entry_is_current_week(): void
    {
        $result = $this->calculator->compute($this->makeInputs());

        $expectedLabel = $this->now->copy()->startOfWeek()->format('d.m')
            .'-'
            .$this->now->copy()->endOfWeek()->format('d.m');

        $this->assertEquals($expectedLabel, last($result['history'])['week_label']);
    }

    #[Test]
    public function history_reflects_hours_in_correct_week(): void
    {
        $twoWeeksAgo = $this->now->copy()->startOfWeek()->subWeeks(2);
        $yw = $twoWeeksAgo->format('o-W');

        $result = $this->calculator->compute($this->makeInputs([
            'users' => collect([$this->makeUser(1)]),
            'capacitiesMap' => [1 => 40],
            'historyByYwAndUser' => [$yw => [1 => 25.0]],
        ]));

        // 12 weeks: index 0 = 11 weeks ago, index 9 = 2 weeks ago
        $this->assertEquals(25.0, $result['history'][9]['load_hours']);
    }

    // ── Immutability ──────────────────────────────────────────────────────────

    #[Test]
    public function calling_compute_twice_with_identical_inputs_returns_identical_output(): void
    {
        $inputs = $this->makeInputs([
            'users' => collect([$this->makeUser(1)]),
            'capacitiesMap' => [1 => 40],
            'weeklyByUser' => [1 => 20.0],
        ]);

        $r1 = $this->calculator->compute($inputs);
        $r2 = $this->calculator->compute($inputs);

        $this->assertEquals($r1, $r2);
    }

    // ── Modified capacity changes utilization ──────────────────────────────────

    #[Test]
    public function increasing_capacity_reduces_utilization(): void
    {
        $user = $this->makeUser(1);

        $base = $this->calculator->compute($this->makeInputs([
            'users' => collect([$user]),
            'capacitiesMap' => [1 => 40],
            'weeklyByUser' => [1 => 40.0],   // 100%
        ]));

        $sim = $this->calculator->compute($this->makeInputs([
            'users' => collect([$user]),
            'capacitiesMap' => [1 => 80],     // doubled
            'weeklyByUser' => [1 => 40.0],   // same load → 50%
        ]));

        $this->assertEquals(100.0, $base['people'][0]['weekly_utilization']);
        $this->assertEquals(50.0, $sim['people'][0]['weekly_utilization']);
    }
}
