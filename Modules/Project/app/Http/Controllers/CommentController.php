<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Project\Contracts\CommentServiceInterface;
use Modules\Project\Http\Requests\StoreCommentRequest;
use Modules\Project\Models\Task;

class CommentController extends Controller
{
    public function __construct(private readonly CommentServiceInterface $commentService)
    {
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCommentRequest $request, int $projectId, Task $task): RedirectResponse
    {
        $this->commentService->store(
            $task,
            $request->user()->id,
            $request->validated(),
        );

        return back();
    }

}
