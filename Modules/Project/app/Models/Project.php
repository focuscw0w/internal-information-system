<?php

namespace Modules\Project\Models;

use App\Enums\PermissionEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Project\Database\Factories\ProjectFactory;
use Modules\Project\Enums\ProjectPermission;
use Modules\User\Models\User;

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
        'owner_id',
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
    ];

    protected $appends = [
        'team_size',
        'is_overdue',
        'days_remaining',
        'is_at_risk',
    ];

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

    public function getIsAtRiskAttribute(): bool
    {
        if ($this->is_overdue) {
            return true;
        }

        $activeTasks = $this->tasks->filter(fn (Task $t) => $t->status !== 'done');

        if ($activeTasks->isEmpty()) {
            return false;
        }

        $atRiskCount = $activeTasks->filter(fn (Task $t) => $t->is_at_risk)->count();

        return ($atRiskCount / $activeTasks->count()) > 0.30;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Methods
    public function updateProgress(): void
    {
        if ($this->tasks_total > 0) {
            $this->progress = round(($this->tasks_completed / $this->tasks_total) * 100);
            $this->save();
        }
    }

    // Relations
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function team(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_team')
            ->withPivot(['permissions', 'allocation', 'hourly_rate'])
            ->withTimestamps();
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class)->oldest();
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(ProjectAllocation::class);
    }

    // Methods
    public function updateTeamMemberPermissions(int $userId, array $permissions): void
    {
        $this->team()->updateExistingPivot($userId, [
            'permissions' => $permissions,
        ]);
    }

    public function userPermissions(User $user): array
    {
        if ($this->owner_id === $user->id) {
            return ProjectPermission::allValues();
        }

        if ($user->hasPermissionTo(PermissionEnum::PROJECTS_VIEW_ALL->value)) {
            return ProjectPermission::allValues();
        }

        $teamMember = $this->team()->where('user_id', $user->id)->first();

        if (! $teamMember) {
            return [];
        }

        $permissions = $teamMember->pivot->permissions;

        if (is_string($permissions)) {
            $permissions = json_decode($permissions, true) ?? [];
        }

        return is_array($permissions) ? $permissions : [];
    }

    public function userHasPermission(User $user, string $permission): bool
    {
        if ($this->owner_id === $user->id) {
            return true;
        }

        if ($user->hasPermissionTo(PermissionEnum::PROJECTS_VIEW_ALL->value)) {
            return true;
        }

        $teamMember = $this->team()->where('user_id', $user->id)->first();

        if (! $teamMember) {
            return false;
        }

        $permissions = $teamMember->pivot->permissions;

        if (is_string($permissions)) {
            $permissions = json_decode($permissions, true) ?? [];
        }

        return in_array($permission, (array) $permissions, strict: true);
    }

    public function userHasAnyPermission(User $user, array $permissions): bool
    {
        if ($this->owner_id === $user->id) {
            return true;
        }

        foreach ($permissions as $permission) {
            if ($this->userHasPermission($user, $permission)) {
                return true;
            }
        }

        return false;
    }

    public function userHasAllPermissions(User $user, array $permissions): bool
    {
        if ($this->owner_id === $user->id) {
            return true;
        }

        foreach ($permissions as $permission) {
            if (! $this->userHasPermission($user, $permission)) {
                return false;
            }
        }

        return true;
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('owner_id', $userId)
            ->orWhereHas('team', fn (Builder $q) => $q->where('user_id', $userId));
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasPermissionTo(PermissionEnum::PROJECTS_VIEW_ALL->value)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->where('owner_id', $user->id)
                ->orWhereHas('team', fn (Builder $tq) => $tq->where('user_id', $user->id));
        });
    }

    // Factory
    protected static function newFactory(): ProjectFactory
    {
        return ProjectFactory::new();
    }
}
