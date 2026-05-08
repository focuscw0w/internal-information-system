<?php

namespace Modules\TimeTracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;

class TimeEntryApprovalController extends Controller
{
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

}
