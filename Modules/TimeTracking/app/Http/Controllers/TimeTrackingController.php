<?php

namespace Modules\TimeTracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\Project\Transformers\ProjectResource;
use Modules\TimeTracking\Contracts\Repositories\TimeEntryRepositoryInterface;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        $monthEntries = $entries->filter(
            fn ($e) => $e->entry_date->between($monthStart, $monthEnd),
        );

        $daysInMonth = $monthEnd->day;
        $monthDailyHours = collect(range(0, $daysInMonth - 1))->map(function ($i) use ($monthStart, $monthEntries) {
            $day = (clone $monthStart)->addDays($i);
            $hours = (float) $monthEntries
                ->filter(fn ($e) => $e->entry_date->isSameDay($day))
                ->sum('hours');

            return [
                'date' => $day->toDateString(),
                'label' => (string) $day->day,
                'short_date' => $day->format('j.n.'),
                'hours' => $hours,
            ];
        })->all();

        $monthProjectHours = $monthEntries
            ->groupBy('project_id')
            ->map(fn ($group) => (float) $group->sum('hours'))
            ->all();

        $weekTotal = (float) $weekEntries->sum('hours');
        $monthTotal = (float) $monthEntries->sum('hours');

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

        $monthRangeLabel = sprintf(
            '%s %d',
            ucfirst($this->slovakMonthLong($monthStart->month)),
            $monthStart->year,
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
                'month_range_label' => $monthRangeLabel,
                'week_total' => $weekTotal,
                'prev_week_total' => $prevWeekTotal,
                'month_total' => $monthTotal,
                'week_target' => $weekTarget,
                'month_target' => $monthTarget,
                'week_daily_hours' => $weekDailyHours,
                'week_project_hours' => $weekProjectHours,
                'month_daily_hours' => $monthDailyHours,
                'month_project_hours' => $monthProjectHours,
            ],
        ]);
    }

    public function export(): StreamedResponse
    {
        $user = auth()->user();
        $entries = $this->timeEntries->entriesForUser($user);
        $filename = 'moj-cas-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($entries) {
            echo "\xEF\xBB\xBF";
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Dátum',
                'Projekt',
                'Úloha',
                'Hodiny',
                'Stav',
                'Popis',
            ], ';');

            foreach ($entries as $entry) {
                /** @var TimeEntry $entry */
                fputcsv($handle, [
                    $entry->entry_date?->toDateString(),
                    $entry->project?->name ?? 'Projekt #'.$entry->project_id,
                    $entry->task?->title ?? 'Úloha #'.$entry->task_id,
                    number_format((float) $entry->hours, 2, '.', ''),
                    TimeEntryStatusEnum::tryFrom($entry->status)?->label() ?? $entry->status,
                    $entry->description ?? '',
                ], ';');
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
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

    private function slovakMonthLong(int $month): string
    {
        return [
            1 => 'január',
            2 => 'február',
            3 => 'marec',
            4 => 'apríl',
            5 => 'máj',
            6 => 'jún',
            7 => 'júl',
            8 => 'august',
            9 => 'september',
            10 => 'október',
            11 => 'november',
            12 => 'december',
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
