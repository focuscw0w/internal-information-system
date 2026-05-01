<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

class CommentAttachment extends Model
{
    protected $fillable = [
        'comment_id',
        'uploaded_by_user_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    protected $appends = ['is_image', 'download_url'];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function getIsImageAttribute(): bool
    {
        return is_string($this->mime_type) && str_starts_with($this->mime_type, 'image/');
    }

    public function getDownloadUrlAttribute(): ?string
    {
        $comment = $this->comment;
        if (! $comment || ! $comment->task) {
            return null;
        }

        return "/projects/{$comment->task->project_id}/tasks/{$comment->task_id}/comments/attachments/{$this->id}/download";
    }
}
