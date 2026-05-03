<?php

namespace Modules\TimeTracking\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\TimeTracking\Models\TimeEntry;

class TimeTrackingController extends Controller
{
    public function __construct(private readonly ProjectServiceInterface $projectService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = $this->projectService->getAllProjects();

        $user = auth()->user();
        $viewAll = (bool) $user?->is_admin;

        $entriesQuery = TimeEntry::with(['task', 'project', 'user'])
            ->orderByDesc('entry_date');

        if (! $viewAll) {
            $entriesQuery->where('user_id', $user->id);
        }

        $entries = $entriesQuery->get();

        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $prevWeekStart = (clone $weekStart)->subWeek();
        $prevWeekEnd = (clone $weekEnd)->subWeek();

        $weekEntries = $entries->filter(
            fn ($e) => $e->entry_date->between($weekStart, $weekEnd),
        );

        $weekDailyHours = collect(range(0, 6))->map(function ($i) use ($weekStart, $weekEntries) {
            $day = (clone $weekStart)->addDays($i);
            $hours = (float) $weekEntries
                ->filter(fn ($e) => $e->entry_date->isSameDay($day))
                ->sum('hours');

            return [
                'date' => $day->toDateString(),
                'label' => ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'][$i],
                'short_date' => $day->format('j.n.'),
                'hours' => $hours,
            ];
        })->all();

        $weekProjectHours = $weekEntries
            ->groupBy('project_id')
            ->map(fn ($group) => (float) $group->sum('hours'))
            ->all();

        $weekTotal = (float) $weekEntries->sum('hours');
        $monthTotal = (float) $entries
            ->filter(fn ($e) => $e->entry_date->between($monthStart, $monthEnd))
            ->sum('hours');

        $prevWeekQuery = TimeEntry::query()
            ->whereBetween('entry_date', [$prevWeekStart, $prevWeekEnd]);

        if (! $viewAll) {
            $prevWeekQuery->where('user_id', $user->id);
        }

        $prevWeekTotal = (float) $prevWeekQuery->sum('hours');

        $weekTarget = $viewAll
            ? $this->teamWeeklyCapacity()
            : 40;

        $weekRangeLabel = sprintf(
            '%s. %s - %s. %s %d',
            $weekStart->day,
            $this->slovakMonthShort($weekStart->month),
            $weekEnd->day,
            $this->slovakMonthShort($weekEnd->month),
            $weekEnd->year,
        );

        return Inertia::render('TimeTracking/Index', [
            'projects' => $projects,
            'entries' => $entries,
            'summary' => [
                'scope' => $viewAll ? 'all' : 'mine',
                'week_start' => $weekStart->toDateString(),
                'week_end' => $weekEnd->toDateString(),
                'week_range_label' => $weekRangeLabel,
                'week_total' => $weekTotal,
                'prev_week_total' => $prevWeekTotal,
                'month_total' => $monthTotal,
                'week_target' => $weekTarget,
                'month_target' => $weekTarget * 4.2,
                'week_daily_hours' => $weekDailyHours,
                'week_project_hours' => $weekProjectHours,
            ],
        ]);
    }

    private function teamWeeklyCapacity(): float
    {
        if (! class_exists(\Modules\CapacityManagement\Models\EmployeeCapacity::class)) {
            return 40.0;
        }

        $sum = (float) \Modules\CapacityManagement\Models\EmployeeCapacity::sum('weekly_capacity_hours');

        return $sum > 0 ? $sum : 40.0;
    }

    private function slovakMonthShort(int $month): string
    {
        return [
            1 => 'jan',
            2 => 'feb',
            3 => 'mar',
            4 => 'apr',
            5 => 'máj',
            6 => 'jún',
            7 => 'júl',
            8 => 'aug',
            9 => 'sep',
            10 => 'okt',
            11 => 'nov',
            12 => 'dec',
        ][$month];
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('timetracking::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        return view('timetracking::show');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('timetracking::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
    }
}
