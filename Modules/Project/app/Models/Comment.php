<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Modules\User\Models\User;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'body',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Comment $comment) {
            $comment->attachments()->each(function (CommentAttachment $attachment) {
                try {
                    Storage::disk($attachment->disk)->delete($attachment->path);
                } catch (\Throwable) {
                    // ignore — best-effort cleanup; DB cascade will still remove the row
                }
            });
        });
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(CommentAttachment::class);
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(CommentMention::class);
    }

    public function mentionedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'comment_mentions',
            'comment_id',
            'mentioned_user_id'
        )->withTimestamps();
    }
}
