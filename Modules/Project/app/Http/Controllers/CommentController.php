<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Project\Contracts\CommentServiceInterface;
use Modules\Project\Http\Requests\Comment\StoreCommentRequest;
use Modules\Project\Models\CommentAttachment;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;

class CommentController extends Controller
{
    public function __construct(private readonly CommentServiceInterface $commentService) {}

    public function store(StoreCommentRequest $request, int $projectId, Task $task): RedirectResponse
    {
        $this->commentService->store(
            $task,
            $request->user()->id,
            $request->validated(),
            $request->file('attachments') ?? []
        );

        return back();
    }

    public function downloadAttachment(int $projectId, Task $task, CommentAttachment $attachment)
    {
        $attachment->load('comment');

        if (! $attachment->comment || $attachment->comment->task_id !== $task->id || $task->project_id !== $projectId) {
            abort(404);
        }

        if (! Storage::disk($attachment->disk)->exists($attachment->path)) {
            abort(404);
        }

        return Storage::disk($attachment->disk)->download(
            $attachment->path,
            $attachment->original_name
        );
    }

    public function mentionLookup(Request $request, int $projectId)
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:50'],
        ]);

        $project = Project::with(['owner', 'team'])->findOrFail($projectId);

        $term = trim((string) $request->query('q', ''));

        $members = collect();
        if ($project->owner) {
            $members->push($project->owner);
        }
        $members = $members->merge($project->team)->unique('id');

        if ($term !== '') {
            $needle = mb_strtolower($term);
            $members = $members->filter(function (User $user) use ($needle) {
                $name = mb_strtolower((string) $user->name);
                $email = mb_strtolower((string) $user->email);

                return str_contains($name, $needle) || str_contains($email, $needle);
            });
        }

        return response()->json([
            'users' => $members->take(8)->values()->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'handle' => $this->buildHandle($u),
            ]),
        ]);
    }

    private function buildHandle(User $user): string
    {
        $local = (string) Str::of((string) $user->email)->before('@');
        if ($local !== '') {
            return mb_strtolower($local);
        }

        return Str::slug((string) $user->name, '-');
    }
}
