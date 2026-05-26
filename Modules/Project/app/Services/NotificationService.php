<?php

namespace Modules\Project\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Contracts\Repositories\ProjectNotificationRepositoryInterface;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Notifications\AtRiskNotification;
use Modules\Project\Notifications\CommentMentionedNotification;
use Modules\Project\Notifications\DeadlineApproachingNotification;
use Modules\Project\Notifications\ProjectCapacityAtRiskNotification;
use Modules\Project\Notifications\ProjectHighPriorityNotification;
use Modules\Project\Notifications\ProjectOverdueNotification;
use Modules\Project\Notifications\ProjectAssignedNotification;
use Modules\Project\Notifications\ProjectStatusChangedNotification;
use Modules\Project\Notifications\TaskAssignedNotification;
use Modules\Project\Notifications\TaskHoursExceededNotification;
use Modules\Project\Notifications\TaskStatusChangedNotification;
use Modules\Project\Notifications\UserOverloadedNotification;
use Modules\Project\Notifications\PasswordResetRequestedNotification;
use Modules\User\Models\User;

class NotificationService implements NotificationServiceInterface
{
    public function __construct(private readonly ProjectNotificationRepositoryInterface $notifications) {}

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

        $users = $this->notifications->usersByIds($newUserIds);

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

        $users = $this->notifications->usersByIds($newUserIds);
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
            $alreadySent = $this->notifications->recentUnreadMatching(
                $user,
                DeadlineApproachingNotification::class,
                function ($n) use ($task, $daysRemaining) {
                    $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                    return ($data['task_id'] ?? null) === $task->id
                        && ($data['days_remaining'] ?? null) === $daysRemaining;
                }
            );

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
            $alreadySent = $this->notifications->recentUnreadMatching(
                $user,
                $notificationClass,
                function ($n) use ($subject, $reason, $subjectId) {
                    $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                    $idField = $subject instanceof Task ? 'task_id' : 'project_id';
                    return ($data[$idField] ?? null) === $subjectId
                        && ($data['reason'] ?? null) === $reason;
                }
            );

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

        $alreadySent = $this->notifications->recentUnreadMatching(
            $project->owner,
            ProjectOverdueNotification::class,
            function ($n) use ($project) {
                $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                return ($data['project_id'] ?? null) === $project->id;
            }
        );

        if (! $alreadySent) {
            $project->owner->notify(new ProjectOverdueNotification($project));
        }
    }

    /**
     * Notify a user that their weekly utilization exceeds 100%.
     */
    public function notifyUserOverloaded(User $user, float $utilization): void
    {
        $alreadySent = $this->notifications->recentUnreadExists($user, UserOverloadedNotification::class);

        if (! $alreadySent) {
            $user->notify(new UserOverloadedNotification($user, $utilization));
        }
    }

    /**
     * Notify project owner and team that capacity prediction shows project won't finish on time.
     */
    public function notifyProjectCapacityAtRisk(Project $project, float $remainingHours, float $confidence): void
    {
        $project->load(['owner', 'team']);

        $recipients = collect();
        if ($project->owner) {
            $recipients->push($project->owner);
        }
        $recipients = $recipients->merge($project->team);

        $notification = new ProjectCapacityAtRiskNotification($project, $remainingHours, $confidence);
        $projectId = $project->id;

        $recipients->unique('id')->each(function (User $user) use ($projectId, $notification) {
            $alreadySent = $this->notifications->recentUnreadMatching(
                $user,
                ProjectCapacityAtRiskNotification::class,
                function ($n) use ($projectId) {
                    $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                    return ($data['project_id'] ?? null) === $projectId;
                }
            );

            if (! $alreadySent) {
                $user->notify($notification);
            }
        });
    }

    /**
     * Notify newly assigned users that the project has high or urgent priority.
     */
    public function notifyProjectHighPriority(Project $project, array $newUserIds, User $assignedBy): void
    {
        if (empty($newUserIds)) {
            return;
        }

        $users = $this->notifications->usersByIds($newUserIds);
        $notification = new ProjectHighPriorityNotification($project, $assignedBy, $project->priority);

        $users->reject(fn (User $u) => $u->id === $assignedBy->id)
            ->each(fn (User $u) => $u->notify($notification));
    }

    /**
     * Notify task stakeholders that actual hours exceeded the estimated hours.
     */
    public function notifyTaskHoursExceeded(Task $task): void
    {
        $task->load(['assignedUsers', 'project.owner']);
        $recipients = $this->getTaskRecipients($task);
        $notification = new TaskHoursExceededNotification($task);
        $taskId = $task->id;

        $recipients->unique('id')->each(function (User $user) use ($taskId, $notification) {
            $alreadySent = $this->notifications->recentUnreadMatching(
                $user,
                TaskHoursExceededNotification::class,
                function ($n) use ($taskId) {
                    $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                    return ($data['task_id'] ?? null) === $taskId;
                }
            );

            if (! $alreadySent) {
                $user->notify($notification);
            }
        });
    }

    /**
     * Notify project team members about a project status change.
     */
    public function notifyProjectStatusChanged(Project $project, string $oldStatus, string $newStatus, User $changedBy): void
    {
        $project->load(['owner', 'team']);

        $recipients = collect();
        if ($project->owner) {
            $recipients->push($project->owner);
        }
        $recipients = $recipients->merge($project->team);

        $notification = new ProjectStatusChangedNotification($project, $oldStatus, $newStatus, $changedBy);

        $recipients->unique('id')
            ->reject(fn (User $u) => $u->id === $changedBy->id)
            ->each(fn (User $u) => $u->notify($notification));
    }

    /**
     * Notify mentioned users about a comment that tagged them.
     */
    public function notifyCommentMentioned(Comment $comment, Collection $mentionedUsers): void
    {
        if ($mentionedUsers->isEmpty()) {
            return;
        }

        $comment->loadMissing(['task.project', 'user']);

        $author = $comment->user;
        if (! $author) {
            return;
        }

        $notification = new CommentMentionedNotification($comment, $author);

        $mentionedUsers
            ->reject(fn (User $u) => $u->id === $author->id)
            ->each(fn (User $u) => $u->notify($notification));
    }

    /**
     * Notify all admins that a user has requested a password reset.
     */
    public function notifyPasswordResetRequested(User $requestingUser): void
    {
        $admins = $this->notifications->admins();
        $notification = new PasswordResetRequestedNotification($requestingUser);
        $admins->each(fn (User $admin) => $admin->notify($notification));
    }

    /**
     * Get paginated notifications for a user.
     */
    public function getUserNotifications(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $this->notifications->paginateForUser($user, $perPage);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $notificationId, User $user): bool
    {
        $notification = $this->notifications->findForUser($user, $notificationId);

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
        return $this->notifications->markAllAsRead($user);
    }

    /**
     * Delete a single notification for a user.
     */
    public function delete(string $notificationId, User $user): bool
    {
        $notification = $this->notifications->findForUser($user, $notificationId);

        if (! $notification) {
            return false;
        }

        $notification->delete();

        return true;
    }

    /**
     * Delete all notifications for a user.
     */
    public function deleteAll(User $user): int
    {
        return $this->notifications->deleteAll($user);
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
