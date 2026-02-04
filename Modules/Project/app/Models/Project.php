<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// use Modules\Project\Database\Factories\ProjectFactory;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'description',
        'status',
        'workload',
        'start_date',
        'end_date',
        'actual_start_date',
        'actual_end_date',
        'progress',
        'capacity_used',
        'capacity_available',
        'tasks_total',
        'tasks_completed',
        'budget',
        'budget_spent',
        'owner_id',
        'client_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'actual_start_date' => 'date',
        'actual_end_date' => 'date',
        'progress' => 'integer',
        'capacity_used' => 'integer',
        'capacity_available' => 'integer',
        'tasks_total' => 'integer',
        'tasks_completed' => 'integer',
        'budget' => 'decimal:2',
        'budget_spent' => 'decimal:2',
    ];

    protected $appends = [
        'team_size',
        'is_overdue',
        'days_remaining',
    ];

    // Relations
    public function owner(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'owner_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Client::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function team(): BelongsToMany
    {
        return $this->belongsToMany(\App\Models\User::class, 'project_team')
            ->withPivot(['role', 'allocation', 'hourly_rate'])
            ->withTimestamps();
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(ProjectAllocation::class);
    }

    // Accessors
    public function getTeamSizeAttribute(): int
    {
        return $this->team()->count();
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->end_date < now() && $this->status !== 'completed';
    }

    public function getDaysRemainingAttribute(): int
    {
        return max(0, now()->diffInDays($this->end_date, false));
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePlanning($query)
    {
        return $query->where('status', 'planning');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeHighWorkload($query)
    {
        return $query->where('workload', 'high');
    }

    // Methods
    public function updateProgress(): void
    {
        if ($this->tasks_total > 0) {
            $this->progress = round(($this->tasks_completed / $this->tasks_total) * 100);
            $this->save();
        }
    }

    public function addTeamMember(int $userId, string $role, int $allocation = 100): void
    {
        $this->team()->attach($userId, [
            'role' => $role,
            'allocation' => $allocation,
        ]);
    }

    public function removeTeamMember(int $userId): void
    {
        $this->team()->detach($userId);
    }

    // Factory
    protected static function newFactory(): ProjectFactory
    {
        return ProjectFactory::new();
    }
}
