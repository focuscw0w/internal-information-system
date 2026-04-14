<?php

namespace Modules\Project\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;

interface NotificationServiceInterface
{
    public function notifyTaskStatusChanged(Task $task, string $oldStatus, string $newStatus): void;

    public function notifyTaskAssigned(Task $task, array $newUserIds, User $assignedBy): void;

    public function notifyProjectAssigned(Project $project, array $newUserIds, User $assignedBy): void;

    public function notifyDeadlineApproaching(Task $task, int $daysRemaining): void;

    public function notifyAtRisk(Task|Project $subject, string $reason): void;

    public function notifyProjectOverdue(Project $project): void;

    public function notifyUserOverloaded(User $user, float $utilization): void;

    public function notifyProjectCapacityAtRisk(Project $project, float $remainingHours, float $confidence): void;

    public function notifyProjectHighWorkload(Project $project, array $newUserIds, User $assignedBy): void;

    public function notifyTaskHoursExceeded(Task $task): void;

    public function notifyProjectStatusChanged(Project $project, string $oldStatus, string $newStatus, User $changedBy): void;

    public function notifyPasswordResetRequested(User $requestingUser): void;

    public function getUserNotifications(User $user, int $perPage = 20): LengthAwarePaginator;

    public function markAsRead(string $notificationId, User $user): bool;

    public function markAllAsRead(User $user): int;
}
