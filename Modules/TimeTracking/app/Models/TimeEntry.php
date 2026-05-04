<?php

namespace Modules\TimeTracking\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Database\Factories\TimeEntryFactory;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\User\Models\User;
use Illuminate\Database\Eloquent\Builder;

class TimeEntry extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'task_id',
        'user_id',
        'entry_date',
        'hours',
        'description',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'hours' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Get the project this entry belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the task this entry belongs to.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who logged this entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->whereBetween('entry_date', [
            now()->startOfWeek(),
            now()->endOfWeek(),
        ]);
    }

    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereBetween('entry_date', [
            now()->startOfMonth(),
            now()->endOfMonth(),
        ]);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', TimeEntryStatusEnum::Pending->value);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', TimeEntryStatusEnum::Approved->value);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', TimeEntryStatusEnum::Rejected->value);
    }

    protected static function newFactory()
    {
        return TimeEntryFactory::new();
    }
}
