<?php

namespace Modules\TimeTracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\Project\Transformers\ProjectResource;
use Modules\TimeTracking\Contracts\Repositories\TimeEntryRepositoryInterface;

class TimeTrackingController extends Controller
{
    public function __construct(
        private readonly ProjectServiceInterface $projectService,
        private readonly TimeEntryRepositoryInterface $timeEntries,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = $this->projectService->getAllProjects();
        $projects->load('tasks.assignedUsers');

        $user = auth()->user();

        $entries = $this->timeEntries->entriesForUser($user);

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

        $prevWeekTotal = (float) $this->timeEntries
            ->totalHoursPerUserInPeriod($prevWeekStart, $prevWeekEnd, [$user->id])
            ->sum();

        $weekTarget = 40;
        $monthTarget = $weekTarget * 4;

        $weekRangeLabel = sprintf(
            '%s. %s - %s. %s %d',
            $weekStart->day,
            $this->slovakMonthShort($weekStart->month),
            $weekEnd->day,
            $this->slovakMonthShort($weekEnd->month),
            $weekEnd->year,
        );

        return Inertia::render('TimeTracking/Index', [
            'projects' => $projects->map(function ($project) use ($user) {
                $data = (new ProjectResource($project))->resolve();
                $data['tasks'] = collect($data['tasks'] ?? [])
                    ->filter(fn (array $task) => collect($task['assigned_users'] ?? [])
                        ->contains('id', $user->id))
                    ->values()
                    ->all();

                return $data;
            })->values(),
            'entries' => $entries,
            'summary' => [
                'scope' => 'mine',
                'week_start' => $weekStart->toDateString(),
                'week_end' => $weekEnd->toDateString(),
                'week_range_label' => $weekRangeLabel,
                'week_total' => $weekTotal,
                'prev_week_total' => $prevWeekTotal,
                'month_total' => $monthTotal,
                'week_target' => $weekTarget,
                'month_target' => $monthTarget,
                'week_daily_hours' => $weekDailyHours,
                'week_project_hours' => $weekProjectHours,
            ],
        ]);
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
    public function store(Request $request) {}

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
    public function update(Request $request, $id) {}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {}
}
