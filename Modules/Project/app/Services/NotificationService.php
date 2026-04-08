<?php

namespace Modules\Project\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Notifications\AtRiskNotification;
use Modules\Project\Notifications\DeadlineApproachingNotification;
use Modules\Project\Notifications\ProjectOverdueNotification;
use Modules\Project\Notifications\ProjectAssignedNotification;
use Modules\Project\Notifications\TaskAssignedNotification;
use Modules\Project\Notifications\TaskStatusChangedNotification;
use Modules\User\Models\User;

class NotificationService implements NotificationServiceInterface
{
    /**
     * Notify task stakeholders about a status change.
     */
    public function notifyTaskStatusChanged(Task $task, string $oldStatus, string $newStatus): void
    {
        $task->load(['assignedUsers', 'project.owner']);
        $actorId = Auth::id();
        $recipients = $this->getTaskRecipients($task);

        $notification = new TaskStatusChangedNotification(
            $task,
            $oldStatus,
            $newStatus,
            Auth::user()
        );

        $recipients->unique('id')
            ->reject(fn (User $user) => $user->id === $actorId)
            ->each(fn (User $user) => $user->notify($notification));
    }

    /**
     * Notify newly assigned users about a task assignment.
     */
    public function notifyTaskAssigned(Task $task, array $newUserIds, User $assignedBy): void
    {
        if (empty($newUserIds)) {
            return;
        }

        $task->load('project');

        $users = User::whereIn('id', $newUserIds)->get();

        $notification = new TaskAssignedNotification($task, $assignedBy);

        $users->reject(fn (User $u) => $u->id === $assignedBy->id)
            ->each(fn (User $u) => $u->notify($notification));
    }

    /**
     * Notify newly assigned users about a project assignment.
     */
    public function notifyProjectAssigned(Project $project, array $newUserIds, User $assignedBy): void
    {
        if (empty($newUserIds)) {
            return;
        }

        $users = User::whereIn('id', $newUserIds)->get();
        $notification = new ProjectAssignedNotification($project, $assignedBy);

        $users->reject(fn (User $u) => $u->id === $assignedBy->id)
            ->each(fn (User $u) => $u->notify($notification));
    }

    /**
     * Notify task stakeholders about an upcoming deadline.
     */
    public function notifyDeadlineApproaching(Task $task, int $daysRemaining): void
    {
        $task->load(['assignedUsers', 'project.owner']);
        $recipients = $this->getTaskRecipients($task);

        $notification = new DeadlineApproachingNotification($task, $daysRemaining);

        $recipients->unique('id')->each(function (User $user) use ($task, $daysRemaining, $notification) {
            $alreadySent = $user->notifications()
                ->where('type', DeadlineApproachingNotification::class)
                ->whereNull('read_at')
                ->where('created_at', '>=', now()->subHours(24))
                ->get()
                ->contains(function ($n) use ($task, $daysRemaining) {
                    $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                    return ($data['task_id'] ?? null) === $task->id
                        && ($data['days_remaining'] ?? null) === $daysRemaining;
                });

            if (! $alreadySent) {
                $user->notify($notification);
            }
        });
    }

    /**
     * Notify stakeholders that a task or project is at risk.
     */
    public function notifyAtRisk(Task|Project $subject, string $reason): void
    {
        if ($subject instanceof Task) {
            $subject->load(['assignedUsers', 'project.owner']);
            $recipients = $this->getTaskRecipients($subject);
            $notificationClass = AtRiskNotification::class;
        } else {
            $subject->load('owner');
            $recipients = collect();
            if ($subject->owner) {
                $recipients->push($subject->owner);
            }
            $notificationClass = AtRiskNotification::class;
        }

        $notification = new AtRiskNotification($subject, $reason);
        $subjectId = $subject->id;

        $recipients->unique('id')->each(function (User $user) use ($subject, $reason, $notification, $notificationClass, $subjectId) {
            $alreadySent = $user->notifications()
                ->where('type', $notificationClass)
                ->whereNull('read_at')
                ->where('created_at', '>=', now()->subHours(24))
                ->get()
                ->contains(function ($n) use ($subject, $reason, $subjectId) {
                    $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                    $idField = $subject instanceof Task ? 'task_id' : 'project_id';
                    return ($data[$idField] ?? null) === $subjectId
                        && ($data['reason'] ?? null) === $reason;
                });

            if (! $alreadySent) {
                $user->notify($notification);
            }
        });
    }

    /**
     * Notify the project owner that a project is overdue.
     */
    public function notifyProjectOverdue(Project $project): void
    {
        $project->load('owner');

        if (! $project->owner) {
            return;
        }

        $alreadySent = $project->owner->notifications()
            ->where('type', ProjectOverdueNotification::class)
            ->whereNull('read_at')
            ->where('created_at', '>=', now()->subHours(24))
            ->get()
            ->contains(function ($n) use ($project) {
                $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                return ($data['project_id'] ?? null) === $project->id;
            });

        if (! $alreadySent) {
            $project->owner->notify(new ProjectOverdueNotification($project));
        }
    }

    /**
     * Get paginated notifications for a user.
     */
    public function getUserNotifications(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $user->notifications()->paginate($perPage);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $notificationId, User $user): bool
    {
        $notification = $user->notifications()->where('id', $notificationId)->first();

        if (! $notification) {
            return false;
        }

        $notification->markAsRead();

        return true;
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(User $user): int
    {
        $count = $user->unreadNotifications()->count();
        $user->unreadNotifications()->update(['read_at' => now()]);

        return $count;
    }

    /**
     * Get all task recipients for notifications.
     */
    private function getTaskRecipients(Task $task)
    {
        $recipients = collect();

        if ($task->assignedUsers) {
            $recipients = $recipients->merge($task->assignedUsers);
        }

        if ($task->project?->owner) {
            $recipients->push($task->project->owner);
        }

        return $recipients;
    }
}
