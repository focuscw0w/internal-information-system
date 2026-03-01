<?php

namespace Modules\TimeTracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Project\Models\Project;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\TimeTracking\Http\Requests\StoreTimeEntryRequest;
use Modules\TimeTracking\Http\Requests\UpdateTimeEntryRequest;

class TimeEntryController extends Controller
{
    public function __construct(
        private readonly TimeEntryServiceInterface $timeEntryService,
    ) {}

    /**
     * Display time entries for a project.
     */
    public function index(int $projectId): Response
    {
        $project = Project::with(['tasks', 'team'])->findOrFail($projectId);

        $entries = $this->timeEntryService->getByProject($projectId);

        return Inertia::render('TimeTracking/TimeEntry', [
            'project' => $project,
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

        return back()->with('success', 'Čas bol zaznamenaný.');
    }

    /**
     * Update an existing time entry.
     */
    public function update(UpdateTimeEntryRequest $request, int $projectId, int $entryId): RedirectResponse
    {
        $updated = $this->timeEntryService->update($entryId, $request->validated());

        if (! $updated) {
            return back()->with('error', 'Záznam sa nepodarilo aktualizovať.');
        }

        return back()->with('success', 'Záznam bol aktualizovaný.');
    }

    /**
     * Delete a time entry.
     */
    public function destroy(int $projectId, int $entryId): RedirectResponse
    {
        $deleted = $this->timeEntryService->delete($entryId);

        if (! $deleted) {
            return back()->with('error', 'Záznam sa nepodarilo odstrániť.');
        }

        return back()->with('success', 'Záznam bol odstránený.');
    }
}
