<?php

namespace Modules\Project\App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'estimated_hours',
        'actual_hours',
        'due_date',
        'completed_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'estimated_hours' => 'integer',
        'actual_hours' => 'integer',
    ];

    protected static function boot() {
         parent::boot();

        // After creating a task
        static::created(function ($task) {
            $task->project->increment('tasks_total');
        });

        // After deleting a task
        static::deleted(function ($task) {
            $task->project->decrement('tasks_total');
        });
        
        // After updating a task's status
        static::updated(function ($task) {
            if ($task->isDirty('status')) {
                $oldStatus = $task->getOriginal('status');
                $newStatus = $task->status;
                
                // If the task changed from a status other than done to done
                if ($oldStatus !== 'done' && $newStatus === 'done') {
                    $task->project->increment('tasks_completed');
                }
                
                // If the task changed from done to another status
                if ($oldStatus === 'done' && $newStatus !== 'done') {
                    $task->project->decrement('tasks_completed');
                }
            }
        });
    }

    // Relations
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // Scopes
    public function scopeTodo($query)
    {
        return $query->where('status', 'todo');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeDone($query)
    {
        return $query->where('status', 'done');
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->whereNotIn('status', ['done']);
    }

    // Methods
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'done',
            'completed_at' => now(),
        ]);
    }

    public function isOverdue(): bool
    {
        return $this->due_date && 
               $this->due_date < now() && 
               $this->status !== 'done';
    }
}