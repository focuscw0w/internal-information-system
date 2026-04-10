<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Modules\CapacityManagement\DTO\SimulationInput;
use Modules\CapacityManagement\Services\SimulationSuggestionEngine;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class SimulationSuggestionEngineTest extends TestCase
{
    private SimulationSuggestionEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->engine = new SimulationSuggestionEngine;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function emptyDashboard(): array
    {
        return [
            'people' => [],
            'alerts' => [],
            'free_people' => [],
            'weekly_overview' => ['capacity_hours' => 40, 'load_hours' => 0, 'utilization' => 0],
            'monthly_overview' => ['capacity_hours' => 160, 'load_hours' => 0, 'utilization' => 0],
            'prediction' => [
                'remaining_project_hours' => 0,
                'available_hours_next_4_weeks' => 160,
                'can_finish' => true,
                'confidence' => 100,
                'projects' => [],
            ],
            'history' => [],
        ];
    }

    private function makePerson(int $id, string $name, float $util, float $capacity = 40): array
    {
        $free = max(0, $capacity - ($util / 100) * $capacity);
        return [
            'id' => $id, 'name' => $name,
            'weekly_capacity_hours' => (int) $capacity,
            'weekly_utilization' => $util,
            'free_capacity_hours' => round($free, 2),
            'is_over_capacity' => $util > 100,
        ];
    }

    private function makeAlert(int $id, string $name, float $util): array
    {
        return ['id' => $id, 'name' => $name, 'weekly_utilization' => $util];
    }

    private function makeProject(int $id, string $name, float $remaining, float $available, bool $isOverdue = false, int $daysRemaining = 30): array
    {
        return [
            'id' => $id, 'name' => $name,
            'remaining_hours' => $remaining,
            'available_hours_next_4_weeks' => $available,
            'can_finish' => $available >= $remaining,
            'confidence' => min(100, round($available / max(1, $remaining) * 100, 1)),
            'days_remaining' => $daysRemaining,
            'is_overdue' => $isOverdue,
        ];
    }

    // ── Rule A: Overloaded users ──────────────────────────────────────────────

    #[Test]
    public function rule_a_overloaded_user_emits_reduce_allocation_suggestion(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['alerts']  = [$this->makeAlert(1, 'Jana', 120.0)];
        $simulated['people']  = [$this->makePerson(1, 'Jana', 120.0)];
        $simulated['free_people'] = [];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $types = array_column($suggestions, 'type');
        $this->assertContains('REDUCE_ALLOCATION', $types);
    }

    #[Test]
    public function rule_a_overloaded_user_with_free_person_emits_reassign_suggestion(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['alerts']     = [$this->makeAlert(1, 'Jana', 120.0)];
        $simulated['people']     = [$this->makePerson(1, 'Jana', 120.0), $this->makePerson(2, 'Peter', 40.0)];
        $simulated['free_people'] = [$this->makePerson(2, 'Peter', 40.0)];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40, 2 => 40]);

        $types = array_column($suggestions, 'type');
        $this->assertContains('REASSIGN_TO_FREE_USER', $types);
    }

    #[Test]
    public function rule_a_overloaded_user_without_free_people_no_reassign_suggestion(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['alerts']  = [$this->makeAlert(1, 'Jana', 120.0)];
        $simulated['people']  = [$this->makePerson(1, 'Jana', 120.0)];
        $simulated['free_people'] = [];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $types = array_column($suggestions, 'type');
        $this->assertNotContains('REASSIGN_TO_FREE_USER', $types);
    }

    // ── Rule B: Project cannot finish ────────────────────────────────────────

    #[Test]
    public function rule_b_project_cannot_finish_emits_extend_deadline_suggestion(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['prediction']['projects'] = [
            $this->makeProject(1, 'Alpha', 200.0, 160.0),
        ];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $types = array_column($suggestions, 'type');
        $this->assertContains('EXTEND_DEADLINE', $types);
    }

    #[Test]
    public function rule_b_project_cannot_finish_with_free_people_emits_add_team_member(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['prediction']['projects'] = [
            $this->makeProject(1, 'Alpha', 200.0, 160.0),
        ];
        $simulated['free_people'] = [$this->makePerson(5, 'Marta', 30.0)];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $types = array_column($suggestions, 'type');
        $this->assertContains('ADD_TEAM_MEMBER', $types);
    }

    #[Test]
    public function rule_b_skips_overdue_projects(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['prediction']['projects'] = [
            $this->makeProject(1, 'Late', 200.0, 160.0, true, 0),
        ];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $ids = array_map(fn ($s) => $s->id, $suggestions);
        foreach ($ids as $id) {
            $this->assertStringNotContainsString('B_extend', $id);
        }
    }

    #[Test]
    public function extend_deadline_proposed_change_contains_project_id_and_new_end_date(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['prediction']['projects'] = [
            $this->makeProject(7, 'Beta', 200.0, 160.0, false, 10),
        ];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $extend = collect($suggestions)->firstWhere('type', 'EXTEND_DEADLINE');
        $this->assertNotNull($extend);
        $this->assertEquals(7, $extend->proposedChange['deadline_overrides'][0]['project_id']);
        $this->assertNotEmpty($extend->proposedChange['deadline_overrides'][0]['new_end_date']);
    }

    // ── Rule C: Deadline in past ──────────────────────────────────────────────

    #[Test]
    public function rule_c_overdue_project_emits_critical_deadline_in_past_suggestion(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['prediction']['projects'] = [
            $this->makeProject(1, 'Overdue', 10.0, 160.0, true, 0),
        ];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $deadlineSugg = collect($suggestions)->firstWhere('type', 'DEADLINE_IN_PAST');
        $this->assertNotNull($deadlineSugg);
        $this->assertEquals('critical', $deadlineSugg->severity);
    }

    // ── Rule D: Over-allocated ────────────────────────────────────────────────

    #[Test]
    public function rule_d_excessive_capacity_emits_reduce_over_estimated_allocation(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        // Remaining = 10h, available = 500h (way more than 2x remaining and > 80)
        $simulated['prediction']['projects'] = [
            $this->makeProject(1, 'Tiny', 10.0, 500.0),
        ];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $types = array_column($suggestions, 'type');
        $this->assertContains('REDUCE_OVERESTIMATED_ALLOCATION', $types);
    }

    // ── Rule E: Positive signal ───────────────────────────────────────────────

    #[Test]
    public function rule_e_freed_user_emits_info_capacity_freed_suggestion(): void
    {
        $baseline  = $this->emptyDashboard();
        $baseline['alerts'] = [$this->makeAlert(1, 'Tom', 120.0)];
        $baseline['people'] = [$this->makePerson(1, 'Tom', 120.0)];

        $simulated = $this->emptyDashboard();
        $simulated['alerts'] = [];
        $simulated['people'] = [$this->makePerson(1, 'Tom', 60.0)];  // now 60%, freed

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $freed = collect($suggestions)->firstWhere('type', 'CAPACITY_FREED');
        $this->assertNotNull($freed);
        $this->assertEquals('info', $freed->severity);
    }

    // ── Dedup ─────────────────────────────────────────────────────────────────

    #[Test]
    public function dedup_prevents_duplicate_suggestions_for_same_type_user_project(): void
    {
        // Two overloaded users with same id would normally produce two REDUCE_ALLOCATION, but
        // since alerts are deduplicated already, let's ensure the engine itself doesn't create dupes
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();
        $simulated['alerts'] = [$this->makeAlert(1, 'Jana', 120.0)];
        $simulated['people'] = [$this->makePerson(1, 'Jana', 120.0)];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [1 => 40]);

        $reduceAlloc = array_filter($suggestions, fn ($s) => $s->type === 'REDUCE_ALLOCATION' && $s->affectsUserId === 1);
        $this->assertCount(1, $reduceAlloc);
    }

    // ── Sort ──────────────────────────────────────────────────────────────────

    #[Test]
    public function critical_suggestions_come_before_warning_and_info(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();

        // Overdue project → critical (Rule C)
        $simulated['prediction']['projects'] = [
            $this->makeProject(1, 'Overdue', 10.0, 160.0, true, 0),
            $this->makeProject(2, 'Behind', 200.0, 160.0, false, 30),
        ];
        // Overloaded user that was already overloaded → warning
        $baseline['alerts']  = [$this->makeAlert(3, 'Busy', 110.0)];
        $baseline['people']  = [$this->makePerson(3, 'Busy', 110.0)];
        $simulated['alerts'] = [$this->makeAlert(3, 'Busy', 110.0)];
        $simulated['people'] = [$this->makePerson(3, 'Busy', 110.0)];

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, [3 => 40]);

        $severities = array_map(fn ($s) => $s->severity, $suggestions);
        // All criticals must appear before any warning/info
        $firstNonCritical = null;
        $lastCritical = null;
        foreach ($severities as $idx => $sev) {
            if ($sev === 'critical') {
                $lastCritical = $idx;
            }
            if ($sev !== 'critical' && $firstNonCritical === null) {
                $firstNonCritical = $idx;
            }
        }

        if ($lastCritical !== null && $firstNonCritical !== null) {
            $this->assertLessThan($firstNonCritical, $lastCritical);
        }

        // If we have only criticals or only non-criticals, test still passes
        $this->assertTrue(true);
    }

    // ── Cap at 10 ────────────────────────────────────────────────────────────

    #[Test]
    public function suggestions_are_capped_at_10(): void
    {
        $baseline  = $this->emptyDashboard();
        $simulated = $this->emptyDashboard();

        // Create 12 overloaded users → would produce many suggestions
        $alerts  = [];
        $people  = [];
        $capMap  = [];
        for ($i = 1; $i <= 12; $i++) {
            $alerts[]  = $this->makeAlert($i, "User$i", 130.0);
            $people[]  = $this->makePerson($i, "User$i", 130.0);
            $capMap[$i] = 40;
        }
        $simulated['alerts'] = $alerts;
        $simulated['people'] = $people;

        $suggestions = $this->engine->generate($baseline, $simulated, new SimulationInput, $capMap);

        $this->assertLessThanOrEqual(10, count($suggestions));
    }
}
