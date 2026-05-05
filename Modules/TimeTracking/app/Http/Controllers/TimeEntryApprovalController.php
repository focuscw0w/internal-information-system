<?php

namespace Modules\TimeTracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Project\Models\Project;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;

class TimeEntryApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = (bool) $user->is_admin;
        $projectIds = $isAdmin
            ? Project::query()->pluck('id')
            : Project::whereUserCanManageTimeEntries($user)->pluck('id');

        abort_if(! $isAdmin && $projectIds->isEmpty(), 403);

        $entries = TimeEntry::pending()
            ->with(['user:id,name,email', 'project:id,name', 'task:id,title'])
            ->when(! $isAdmin, fn ($query) => $query->whereIn('project_id', $projectIds))
            ->when($request->filled('user_id'), fn ($query) => $query->where('user_id', $request->integer('user_id')))
            ->when($request->filled('project_id'), fn ($query) => $query->where('project_id', $request->integer('project_id')))
            ->when($request->filled('date_from'), fn ($query) => $query->whereDate('entry_date', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($query) => $query->whereDate('entry_date', '<=', $request->date('date_to')))
            ->orderBy('entry_date')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (TimeEntry $entry) => $this->serializeEntry($entry));

        $filterProjects = Project::query()
            ->whereIn('id', $projectIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        $filterUsers = TimeEntry::pending()
            ->when(! $isAdmin, fn ($query) => $query->whereIn('project_id', $projectIds))
            ->with('user:id,name,email')
            ->get()
            ->pluck('user')
            ->filter()
            ->unique('id')
            ->sortBy('name')
            ->values()
            ->map(fn ($entryUser) => [
                'id' => $entryUser->id,
                'name' => $entryUser->name,
                'email' => $entryUser->email,
            ]);

        return Inertia::render('TimeTracking/manager/Approvals', [
            'entries' => $entries,
            'filters' => $request->only(['user_id', 'project_id', 'date_from', 'date_to']),
            'filterOptions' => [
                'users' => $filterUsers,
                'projects' => $filterProjects,
            ],
        ]);
    }

    public function approve(Request $request, int $id): RedirectResponse
    {
        $entry = TimeEntry::with('project')->findOrFail($id);
        $this->authorizeEntry($request, $entry);

        $entry->update([
            'status' => TimeEntryStatusEnum::Approved->value,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        return back()->with('success', 'Záznam bol schválený.');
    }

    public function reject(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $entry = TimeEntry::with('project')->findOrFail($id);
        $this->authorizeEntry($request, $entry);

        $entry->update([
            'status' => TimeEntryStatusEnum::Rejected->value,
            'approved_by' => null,
            'approved_at' => null,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', 'Záznam bol zamietnutý.');
    }

    public function bulkApprove(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:time_entries,id'],
        ]);

        $entries = TimeEntry::with('project')
            ->whereIn('id', $validated['ids'])
            ->get();

        $problematicIds = $entries
            ->filter(fn (TimeEntry $entry) => ! $this->canApproveEntry($request, $entry))
            ->pluck('id')
            ->values()
            ->all();

        if ($problematicIds !== []) {
            return response()->json([
                'message' => 'Niektoré záznamy nemôžete schváliť.',
                'problematic_ids' => $problematicIds,
            ], 403);
        }

        DB::transaction(function () use ($entries, $request) {
            TimeEntry::query()
                ->whereIn('id', $entries->pluck('id'))
                ->update([
                    'status' => TimeEntryStatusEnum::Approved->value,
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                    'rejection_reason' => null,
                ]);
        });

        return back()->with('success', 'Vybrané záznamy boli schválené.');
    }

    private function authorizeEntry(Request $request, TimeEntry $entry): void
    {
        abort_if(! $this->canApproveEntry($request, $entry), 403);
    }

    private function canApproveEntry(Request $request, TimeEntry $entry): bool
    {
        $user = $request->user();

        if ($entry->user_id === $user->id) {
            return false;
        }

        return $user->is_admin
            || $entry->project->userHasPermission($user, 'manage_time_entries');
    }

    private function serializeEntry(TimeEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'project_id' => $entry->project_id,
            'task_id' => $entry->task_id,
            'user_id' => $entry->user_id,
            'entry_date' => $entry->entry_date?->toDateString(),
            'hours' => (float) $entry->hours,
            'description' => $entry->description,
            'status' => $entry->status,
            'user' => [
                'id' => $entry->user?->id,
                'name' => $entry->user?->name ?? 'Bez mena',
                'email' => $entry->user?->email,
            ],
            'project' => [
                'id' => $entry->project?->id,
                'name' => $entry->project?->name ?? 'Bez projektu',
            ],
            'task' => [
                'id' => $entry->task?->id,
                'title' => $entry->task?->title ?? 'Bez úlohy',
            ],
        ];
    }
}
