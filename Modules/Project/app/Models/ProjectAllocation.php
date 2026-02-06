<?php

namespace Modules\Project\App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class ProjectAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'user_id',
        'allocated_hours',
        'used_hours',
        'percentage',
        'start_date',
        'end_date',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'allocated_hours' => 'integer',
        'used_hours' => 'integer',
        'percentage' => 'integer',
    ];

    protected $appends = [
        'remaining_hours',
        'utilization_percentage',
    ];

    // Relations
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Accessors
    public function getRemainingHoursAttribute(): int
    {
        return max(0, $this->allocated_hours - $this->used_hours);
    }

    public function getUtilizationPercentageAttribute(): float
    {
        if ($this->allocated_hours === 0) {
            return 0;
        }
        
        return round(($this->used_hours / $this->allocated_hours) * 100, 2);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    // Methods
    public function addUsedHours(int $hours): void
    {
        $this->increment('used_hours', $hours);
    }

    public function isOverallocated(): bool
    {
        return $this->used_hours > $this->allocated_hours;
    }

    public function isActive(): bool
    {
        return $this->start_date <= now() && $this->end_date >= now();
    }
}