<?php

namespace Modules\Project\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Project\Contracts\CommentServiceInterface;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Models\Comment;
use Modules\Project\Models\CommentAttachment;
use Modules\Project\Models\Task;
use Modules\User\Models\User;

class CommentService implements CommentServiceInterface
{
    private const ATTACHMENT_DISK = 'local';
    private const MAX_MENTIONS = 25;
    private const ALLOWED_MIME_PREFIXES = [
        'image/',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument',
        'application/vnd.ms-excel',
        'text/',
    ];

    public function __construct(
        private readonly NotificationServiceInterface $notificationService,
    ) {}

    /**
     * @param  array<int, UploadedFile>  $files
     */
    public function store(Task $task, int $userId, array $data, array $files = []): Comment
    {
        $task->loadMissing('project.team', 'project.owner');

        return DB::transaction(function () use ($task, $userId, $data, $files) {
            $comment = $task->comments()->create([
                'user_id' => $userId,
                'body' => $data['body'],
            ]);

            foreach ($files as $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }
                $this->storeAttachment($comment, $file, $userId);
            }

            $mentionedUserIds = $this->parseMentions($comment->body, $task);

            if (! empty($mentionedUserIds)) {
                $rows = collect($mentionedUserIds)
                    ->map(fn (int $id) => [
                        'comment_id' => $comment->id,
                        'mentioned_user_id' => $id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                    ->all();

                DB::table('comment_mentions')->insertOrIgnore($rows);
            }

            DB::afterCommit(function () use ($comment, $mentionedUserIds) {
                if (empty($mentionedUserIds)) {
                    return;
                }

                $users = User::whereIn('id', $mentionedUserIds)->get();
                $this->notificationService->notifyCommentMentioned(
                    $comment->fresh(['user', 'task.project']),
                    $users
                );
            });

            return $comment->load(['user', 'attachments', 'mentionedUsers']);
        });
    }

    private function storeAttachment(Comment $comment, UploadedFile $file, int $userId): void
    {
        $mime = $file->getMimeType() ?? 'application/octet-stream';
        if (! $this->isMimeAllowed($mime)) {
            return;
        }

        $extension = $file->getClientOriginalExtension() ?: 'bin';
        $filename = Str::uuid()->toString().'.'.$extension;
        $directory = "comments/{$comment->id}";

        $path = $file->storeAs($directory, $filename, self::ATTACHMENT_DISK);

        if (! $path) {
            return;
        }

        CommentAttachment::create([
            'comment_id' => $comment->id,
            'uploaded_by_user_id' => $userId,
            'disk' => self::ATTACHMENT_DISK,
            'path' => $path,
            'original_name' => mb_substr($file->getClientOriginalName(), 0, 255),
            'mime_type' => mb_substr($mime, 0, 128),
            'size_bytes' => $file->getSize() ?: 0,
        ]);
    }

    private function isMimeAllowed(string $mime): bool
    {
        foreach (self::ALLOWED_MIME_PREFIXES as $prefix) {
            if (str_starts_with($mime, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Parse @username tokens from the body and resolve them to user IDs that
     * are actually members of the comment's project (owner or team).
     *
     * @return array<int, int>
     */
    private function parseMentions(string $body, Task $task): array
    {
        if (! preg_match_all('/@([a-zA-Z0-9._-]+)/', $body, $matches)) {
            return [];
        }

        $tokens = collect($matches[1])
            ->filter()
            ->map(fn (string $t) => mb_strtolower($t))
            ->unique()
            ->take(self::MAX_MENTIONS)
            ->values();

        if ($tokens->isEmpty()) {
            return [];
        }

        $allowedUserIds = $this->projectMemberIds($task);
        if ($allowedUserIds->isEmpty()) {
            return [];
        }

        $candidates = User::whereIn('id', $allowedUserIds)->get(['id', 'name', 'email']);

        $resolved = collect();
        foreach ($candidates as $user) {
            $emailLocal = mb_strtolower((string) Str::of((string) $user->email)->before('@'));
            $nameSlug = Str::slug((string) $user->name, '-');

            $aliases = collect([$emailLocal, $nameSlug])
                ->filter(fn (string $a) => $a !== '')
                ->map(fn (string $a) => mb_strtolower($a));

            if ($aliases->intersect($tokens)->isNotEmpty()) {
                $resolved->push($user->id);
            }
        }

        return $resolved->unique()->values()->all();
    }

    private function projectMemberIds(Task $task): Collection
    {
        $project = $task->project;
        if (! $project) {
            return collect();
        }

        $ids = collect();
        if ($project->owner_id) {
            $ids->push($project->owner_id);
        }
        $ids = $ids->merge($project->team->pluck('id'));

        return $ids->unique()->values();
    }
}
