import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAvatarColor } from '@/lib/avatar-color';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    FileText,
    ListChecks,
    MoreHorizontal,
    Plus,
    Settings,
} from 'lucide-react';
import { TaskTimerButton } from '../../../../TimeTracking/resources/js/components/task-timer-button';
import { EditTaskDialog } from '../components/project-detail/task-table/dialogs/edit-task';
import { Comments } from '../components/task-detail/comments';
import { AssignTaskDialog } from '../components/task-detail/dialogs/assign-users';
import { CreateSubtaskDialog } from '../components/task-detail/dialogs/subtask/create-subtask';
import { Subtasks } from '../components/task-detail/tab-views/subtasks';
import { BadgeLabel } from '../components/ui/badge';
import ProjectLayout from '../layouts/project-layout';
import {
    Activity,
    Project,
    Task,
    TaskPriority,
    TaskStatus,
} from '../types/types';

type TeamCapacitySnapshot = Record<
    number,
    {
        weekly_capacity_hours: number;
        weekly_load_hours: number;
        weekly_utilization: number;
        free_capacity_hours: number;
        is_over_capacity: boolean;
    }
>;

interface TaskProps {
    task: Task;
    project: Project;
    team_capacity: TeamCapacitySnapshot;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Na spracovanie' },
    { value: 'in_progress', label: 'Prebieha' },
    { value: 'testing', label: 'Testovanie' },
    { value: 'done', label: 'Hotovo' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Nízka' },
    { value: 'medium', label: 'Stredná' },
    { value: 'high', label: 'Vysoká' },
    { value: 'urgent', label: 'Urgentná' },
];

function formatDate(date?: string | null): string {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('sk-SK');
}

function formatHours(hours?: number | string | null): string {
    const value = Number(hours ?? 0);
    return `${Number.isInteger(value) ? value : value.toFixed(1)}h`;
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function relativeDate(date: string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'teraz';
    if (diffHours < 24) return `pred ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'včera';
    if (diffDays < 7) return `pred ${diffDays} dňami`;

    return formatDate(date);
}

export default function TaskPage({ task, project, team_capacity }: TaskProps) {
    const projectWithCapacity: Project = {
        ...project,
        team: project.team.map((member) => ({
            ...member,
            ...(team_capacity[member.id] ?? {}),
        })),
    };
    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);
    const subtasks = task.subtasks ?? [];
    const timeEntries = task.time_entries ?? [];

    const taskActivities = (project.activities ?? [])
        .filter((activity) => {
            if (
                activity.subject_id === task.id &&
                activity.subject_type?.toLowerCase().includes('task')
            ) {
                return true;
            }
            return activity.description?.includes(task.title);
        })
        .slice()
        .reverse()
        .slice(0, 5);

    return (
        <ProjectLayout project={projectWithCapacity} task={task}>
            <Head title={`${task.title} - ${project.name}`} />

            <div className="page min-h-screen">
                <Link
                    href={`/projects/${project.id}`}
                    className="page-head__back"
                >
                    <ArrowLeft />
                    Späť na {project.name}
                </Link>

                <div className="page-head">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                                TASK-{task.id}
                            </span>
                            <BadgeLabel
                                type="task-status"
                                value={task.status}
                            />
                            <BadgeLabel type="priority" value={task.priority} />
                        </div>
                        <h1 className="page-head__title">{task.title}</h1>
                        <p className="page-head__subtitle">
                            Súčasť projektu{' '}
                            <strong className="font-semibold text-foreground">
                                {project.name}
                            </strong>{' '}
                            · termín {formatDate(task.due_date)}
                        </p>
                    </div>

                    <div className="page-head__actions">
                        <TaskTimerButton
                            project={projectWithCapacity}
                            task={task}
                            label="Spustiť timer"
                            className="btn"
                        />
                        {can('edit_tasks') && (
                            <EditTaskDialog
                                task={task}
                                projectId={project.id}
                                team={projectWithCapacity.team}
                                text="Upraviť úlohu"
                                icon={<Settings className="h-4 w-4" />}
                                triggerClassName="btn btn--primary"
                            />
                        )}
                    </div>
                </div>

                <Tabs defaultValue="overview" className="mb-12 w-full">
                    <TabsList
                        variant="line"
                        className="tabbar w-full justify-start"
                    >
                        <TabsTrigger value="overview">
                            <FileText className="h-4 w-4" />
                            Prehľad
                        </TabsTrigger>
                        {can('edit_tasks') && (
                            <TabsTrigger value="subtasks">
                                <ListChecks className="h-4 w-4" />
                                Podúlohy
                                <span className="tab__count">
                                    {subtasks.length}
                                </span>
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="time">
                            <Clock className="h-4 w-4" />
                            Záznamy času
                            <span className="tab__count">
                                {timeEntries.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        <div className="grid-main-side">
                            <div className="col gap-4">
                                <DescriptionCard task={task} />
                                {can('edit_tasks') && (
                                    <SubtaskPreview
                                        task={task}
                                        projectId={project.id}
                                    />
                                )}
                                <Comments task={task} />
                            </div>
                            <TaskAside
                                task={task}
                                project={projectWithCapacity}
                                canEdit={can('edit_tasks')}
                                canAssign={can('assign_tasks')}
                                activities={taskActivities}
                            />
                        </div>
                    </TabsContent>

                    {can('edit_tasks') && (
                        <TabsContent value="subtasks" className="mt-6">
                            <div className="grid-main-side">
                                <div className="col gap-4">
                                    <Subtasks
                                        task={task}
                                        projectId={project.id}
                                    />
                                </div>
                                <TaskAside
                                    task={task}
                                    project={projectWithCapacity}
                                    canEdit={can('edit_tasks')}
                                    canAssign={can('assign_tasks')}
                                    activities={taskActivities}
                                />
                            </div>
                        </TabsContent>
                    )}

                    <TabsContent value="time" className="mt-6">
                        <div className="grid-main-side">
                            <div className="col gap-4">
                                <TimeEntriesTable task={task} />
                            </div>
                            <TaskAside
                                task={task}
                                project={projectWithCapacity}
                                canEdit={can('edit_tasks')}
                                canAssign={can('assign_tasks')}
                                activities={taskActivities}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ProjectLayout>
    );
}

function DescriptionCard({ task }: { task: Task }) {
    return (
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Popis</h3>
            </div>
            <div className="card__body">
                {task.description ? (
                    <p className="max-w-5xl text-sm leading-6 text-foreground">
                        {task.description}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Žiadny popis nebol pridaný.
                    </p>
                )}
            </div>
        </section>
    );
}

function SubtaskPreview({
    task,
    projectId,
}: {
    task: Task;
    projectId: number;
}) {
    const subtasks = task.subtasks ?? [];
    const completed = subtasks.filter((subtask) => subtask.is_completed).length;

    const toggle = (subtaskId: number) => {
        router.patch(
            `/projects/${projectId}/tasks/${task.id}/subtasks/${subtaskId}/toggle`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Podúlohy</h3>
                    <div className="card__sub">
                        {completed} z {subtasks.length} dokončených
                    </div>
                </div>
                <CreateSubtaskDialog projectId={projectId} taskId={task.id} />
            </div>
            <div className="card__body">
                {subtasks.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                        Zatiaľ žiadne podúlohy.
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {subtasks.map((subtask) => (
                            <div
                                key={subtask.id}
                                className="flex min-h-10 items-center gap-3 py-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={subtask.is_completed}
                                    onChange={() => toggle(subtask.id)}
                                    className="size-4 rounded border-input text-[var(--accent-blue)]"
                                />
                                <span
                                    className={`flex-1 text-sm ${
                                        subtask.is_completed
                                            ? 'text-muted-foreground line-through'
                                            : 'text-foreground'
                                    }`}
                                >
                                    {subtask.title}
                                </span>
                                <button type="button" className="icon-btn">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function TimeEntriesTable({ task }: { task: Task }) {
    const entries = (task.time_entries ?? [])
        .slice()
        .sort(
            (a, b) =>
                new Date(b.entry_date).getTime() -
                new Date(a.entry_date).getTime(),
        );

    return (
        <section className="card">
            <div className="card__body card__body--flush">
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <Clock className="mb-3 h-8 w-8 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">
                            Zatiaľ žiadne záznamy času
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Po zapísaní práce sa zobrazí dátum, používateľ,
                            popis a hodiny.
                        </p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Dátum</th>
                                <th>Používateľ</th>
                                <th>Popis</th>
                                <th className="text-right">Hodiny</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="mono font-medium">
                                        {formatDate(entry.entry_date)}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {entry.user && (
                                                <span className={`avatar avatar--sm ${getAvatarColor(entry.user.name)}`}>
                                                    {initials(entry.user.name)}
                                                </span>
                                            )}
                                            <span>
                                                {entry.user?.name ??
                                                    'Neznámy používateľ'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{entry.description || 'Bez popisu'}</td>
                                    <td className="text-right font-medium">
                                        {formatHours(entry.hours)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

function TaskAside({
    task,
    project,
    canEdit,
    canAssign,
    activities,
}: {
    task: Task;
    project: Project;
    canEdit: boolean;
    canAssign: boolean;
    activities: Activity[];
}) {
    const estimated = Number(task.estimated_hours ?? 0);
    const actual = Number(task.actual_hours ?? 0);
    const progress =
        estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0;
    const isOverEstimate = estimated > 0 && actual > estimated;

    const updateStatus = (status: TaskStatus) => {
        router.patch(
            `/projects/${project.id}/tasks/${task.id}/status`,
            { status },
            { preserveScroll: true },
        );
    };

    const updatePriority = (priority: TaskPriority) => {
        router.put(
            `/projects/${project.id}/tasks/${task.id}`,
            {
                title: task.title,
                description: task.description ?? '',
                status: task.status,
                priority,
                estimated_hours: String(task.estimated_hours ?? ''),
                start_date: task.start_date ?? '',
                due_date: task.due_date ?? '',
                assigned_users:
                    task.assigned_users?.map((user) => user.id) ?? [],
            },
            { preserveScroll: true },
        );
    };

    return (
        <aside className="col gap-4">
            <section className="card">
                <div className="card__head">
                    <h3 className="card__title">Detaily úlohy</h3>
                </div>
                <div className="card__body space-y-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Stav
                        </label>
                        <select
                            className="select w-full"
                            value={task.status}
                            disabled={!canEdit}
                            onChange={(event) =>
                                updateStatus(event.target.value as TaskStatus)
                            }
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Priorita
                        </label>
                        <select
                            className="select w-full"
                            value={task.priority}
                            disabled={!canEdit}
                            onChange={(event) =>
                                updatePriority(
                                    event.target.value as TaskPriority,
                                )
                            }
                        >
                            {PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Priradení
                        </div>
                        <div className="space-y-1.5">
                            {(task.assigned_users ?? []).map((user) => (
                                <div
                                    key={user.id}
                                    className="flex h-7 items-center gap-2 rounded-md bg-muted px-2"
                                >
                                    <span className={`avatar avatar--sm ${getAvatarColor(user.name)}`}>
                                        {initials(user.name)}
                                    </span>
                                    <span className="truncate text-sm font-medium text-foreground">
                                        {user.name}
                                    </span>
                                </div>
                            ))}
                            {(task.assigned_users ?? []).length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Nikto nie je priradený.
                                </p>
                            )}
                        </div>
                        {canAssign && (
                            <AssignTaskDialog
                                task={task}
                                project={project}
                                triggerLabel="Pridať priradenie"
                                triggerClassName="btn btn--ghost btn--sm mt-2"
                                triggerIcon={<Plus className="h-3.5 w-3.5" />}
                            />
                        )}
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                        <DetailRow
                            label="Termín"
                            value={formatDate(task.due_date)}
                        />
                        <DetailRow
                            label="Odhad"
                            value={formatHours(task.estimated_hours)}
                        />
                        <DetailRow
                            label="Strávené"
                            value={formatHours(task.actual_hours)}
                            danger={isOverEstimate}
                        />
                        {estimated > 0 && (
                            <div className="progress">
                                <div
                                    className={`progress__fill ${
                                        isOverEstimate
                                            ? 'progress__fill--danger'
                                            : ''
                                    }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="card">
                <div className="card__head">
                    <h3 className="card__title">Aktivita</h3>
                </div>
                <div className="card__body space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Zatiaľ žiadna aktivita.
                        </p>
                    ) : (
                        activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="text-sm leading-5"
                            >
                                <p className="font-medium text-foreground">
                                    {activity.user?.name ?? 'Systém'}{' '}
                                    <span className="font-normal text-muted-foreground">
                                        {activity.description}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {relativeDate(activity.created_at)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </aside>
    );
}

function DetailRow({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: string;
    danger?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={`text-right font-medium ${
                    danger ? 'text-[var(--danger-text)]' : 'text-foreground'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
