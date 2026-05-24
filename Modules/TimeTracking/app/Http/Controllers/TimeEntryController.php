<?php

namespace Modules\TimeTracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\Project\Transformers\ProjectResource;
use Modules\TimeTracking\Contracts\Repositories\TimeEntryRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingProjectRepositoryInterface;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\TimeTracking\Http\Requests\StoreTimeEntryRequest;
use Modules\TimeTracking\Http\Requests\UpdateTimeEntryRequest;

class TimeEntryController extends Controller
{
    public function __construct(
        private readonly TimeEntryServiceInterface $timeEntryService,
        private readonly ProjectServiceInterface $projectService,
        private readonly TimeEntryRepositoryInterface $timeEntries,
        private readonly TimeTrackingProjectRepositoryInterface $timeProjects,
    ) {}

    /**
     * Display time entries for a project.
     */
    public function index(int $projectId)
    {
        $project = $this->projectService->getProjectById($projectId);
        if (! $project) {
            return back()->with('error', 'Project not found.');
        }

        $filters = [];

        if (! $project->userHasPermission(auth()->user(), 'view_all_time_entries')) {
            $filters['user_id'] = auth()->id();
        }

        $entries = $this->timeEntryService->getByProject($projectId, $filters);

        return Inertia::render('TimeTracking/TimeEntry', [
            'project' => (new ProjectResource($project))->resolve(),
            'entries' => $entries,
        ]);
    }

    /**
     * Store a new time entry.
     */
    public function store(StoreTimeEntryRequest $request, int $projectId): RedirectResponse
    {
        $this->timeEntryService->create([
            ...$request->validated(),
            'project_id' => $projectId,
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Time entry added successfully.');
    }

    /**
     * Update an existing time entry.
     */
    public function update(UpdateTimeEntryRequest $request, int $projectId, int $entryId): RedirectResponse
    {
        $entry = $this->timeEntries->find($entryId);
        if (! $entry || $entry->project_id !== $projectId) {
            return back()->with('error', 'Time entry not found.');
        }

        $updated = $this->timeEntryService->update($entryId, $request->validated());

        if (! $updated) {
            return back()->with('error', 'Time entry update failed.');
        }

        return back()->with('success', 'Time entry updated successfully.');
    }

    /**
     * Delete a time entry.
     */
    public function destroy(int $projectId, int $entryId): RedirectResponse
    {
        $entry = $this->timeEntries->find($entryId);
        if (! $entry || $entry->project_id !== $projectId) {
            return back()->with('error', 'Time entry not found.');
        }

        $deleted = $this->timeEntryService->delete($entryId);

        if (! $deleted) {
            return back()->with('error', 'Time entry delete failed.');
        }

        return back()->with('success', 'Time entry deleted successfully.');
    }

    public function timerProjects(): JsonResponse
    {
        $projects = $this->timeProjects->timerProjectsForUser((int) auth()->id());

        return response()->json($projects);
    }
}
