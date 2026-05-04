import { Card, CardContent } from '@/components/ui/card';
import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { router } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, Clock3, Plus } from 'lucide-react';
import { useState } from 'react';
import { Project, Task, TaskPriority, TaskStatus } from '../../../types/types';
import { CreateTaskDialog } from '../task-table/dialogs/create-task';
import { Draggable } from './draggable';
import { Droppable } from './droppable';

interface KanbanProps {
    project: Project;
}

export function Kanban({ project }: KanbanProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

    const canEditTasks = can('edit_tasks');
    const canViewTasks = can('view_tasks');

    const columns: {
        id: TaskStatus;
        title: string;
        status: TaskStatus;
        dotClass: string;
    }[] = [
        {
            id: 'todo',
            title: 'Na vykonanie',
            status: 'todo',
            dotClass: 'bg-slate-400',
        },
        {
            id: 'in_progress',
            title: 'Prebieha',
            status: 'in_progress',
            dotClass: 'bg-blue-500',
        },
        {
            id: 'testing',
            title: 'Testovanie',
            status: 'testing',
            dotClass: 'bg-amber-500',
        },
        {
            id: 'done',
            title: 'Hotovo',
            status: 'done',
            dotClass: 'bg-emerald-500',
        },
    ];
    const columnStatuses = columns.map((column) => column.status);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const getTasksByStatus = (status: TaskStatus) => {
        return project.tasks?.filter((task) => task.status === status) || [];
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (!canEditTasks) return;
        const { active } = event;
        const task = project.tasks?.find((t) => t.id === active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveTask(null);

        if (!over || !canEditTasks) return;

        const taskId = active.id;
        const newStatus = over.id as TaskStatus;

        const task = project.tasks?.find((t) => t.id === taskId);

        if (!task) return;
        if (!columnStatuses.includes(newStatus)) return;
        if (task.status === newStatus) return;

        router.patch(
            `/projects/${project.id}/tasks/${taskId}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['project'],
            },
        );
    };

    const handleDragCancel = () => {
        setActiveTask(null);
    };

    const handleTaskClick = (taskId: number) => {
        if (!canViewTasks) return;
        router.visit(`/projects/${project.id}/tasks/${taskId}`);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
                {columns.map((column) => {
                    const tasks = getTasksByStatus(column.status);
                    return (
                        <Droppable
                            key={column.id}
                            id={column.status}
                            disabled={!canEditTasks}
                        >
                            <section className="flex min-h-[460px] flex-col rounded-lg border border-border bg-muted/55 p-3">
                                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`size-1.5 rounded-full ${column.dotClass}`}
                                        />
                                        <h3 className="text-xs font-semibold text-foreground">
                                            {column.title}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {tasks.length}
                                        </span>
                                    </div>
                                    {canEditTasks && (
                                        <CreateTaskDialog
                                            projectId={project.id}
                                            team={project.team}
                                            initialStatus={column.status}
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="icon-btn size-7"
                                                    title={`Pridať úlohu do: ${column.title}`}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            }
                                        />
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col gap-2">
                                    {tasks.map((task) =>
                                        canEditTasks ? (
                                            <Draggable
                                                key={task.id}
                                                id={task.id}
                                            >
                                                <TaskCard
                                                    task={task}
                                                    canViewTasks={canViewTasks}
                                                    dragging
                                                    onClick={() =>
                                                        handleTaskClick(task.id)
                                                    }
                                                />
                                            </Draggable>
                                        ) : (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                canViewTasks={canViewTasks}
                                                onClick={() =>
                                                    handleTaskClick(task.id)
                                                }
                                            />
                                        ),
                                    )}
                                    {tasks.length === 0 && (
                                        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                                            Žiadne úlohy
                                        </p>
                                    )}
                                </div>

                                {canEditTasks && (
                                    <CreateTaskDialog
                                        projectId={project.id}
                                        team={project.team}
                                        initialStatus={column.status}
                                        trigger={
                                            <button
                                                type="button"
                                                className="mt-2 flex h-8 items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Pridať úlohu
                                            </button>
                                        }
                                    />
                                )}
                            </section>
                        </Droppable>
                    );
                })}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <TaskCard task={activeTask} canViewTasks dragging overlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function TaskCard({
    task,
    canViewTasks,
    dragging = false,
    overlay = false,
    onClick,
}: {
    task: Task;
    canViewTasks: boolean;
    dragging?: boolean;
    overlay?: boolean;
    onClick?: () => void;
}) {
    return (
        <Card
            className={`rounded-lg border bg-card shadow-xs transition-all hover:border-border hover:shadow-sm ${
                canViewTasks ? (dragging ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer') : 'cursor-default'
            } ${overlay ? 'w-72 rotate-1 shadow-lg' : ''} ${task.is_at_risk ? 'border-l-4 border-l-[var(--warning)]' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="mono text-[11px] font-medium uppercase text-muted-foreground">
                            TASK-{String(task.id).padStart(3, '0')}
                        </div>
                        <h4 className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-foreground">
                            {task.title}
                        </h4>
                    </div>
                    {task.is_at_risk && (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning-text)]" />
                    )}
                </div>

                <div className="mb-3 flex items-center justify-between gap-2">
                    <PriorityBadge priority={task.priority} />
                    <AssigneeAvatars task={task} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                    <span className="mono flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatHours(task.actual_hours)} /{' '}
                        {formatHours(task.estimated_hours)}h
                    </span>
                    <span className="mono flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {task.due_date ? formatShortDate(task.due_date) : '-'}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
    const meta = {
        low: {
            label: 'Nízka',
            className: 'border-border bg-card text-muted-foreground',
        },
        medium: {
            label: 'Stredná',
            className: 'border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]',
        },
        high: {
            label: 'Vysoká',
            className: 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]',
        },
        urgent: {
            label: 'Kritická',
            className: 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]',
        },
    }[priority];

    return (
        <span className={`badge ${meta.className}`}>
            {meta.label}
        </span>
    );
}

function AssigneeAvatars({ task }: { task: Task }) {
    const assignees = task.assigned_users ?? [];

    if (assignees.length === 0) {
        return null;
    }

    return (
        <div className="avatars">
            {assignees.slice(0, 3).map((user, index) => (
                <span
                    key={user.id}
                    className={`avatar avatar--sm ${avatarTone(index)}`}
                    title={user.name}
                >
                    {initials(user.name)}
                </span>
            ))}
            {assignees.length > 3 && (
                <span className="avatar avatar--sm bg-muted text-muted-foreground">
                    +{assignees.length - 3}
                </span>
            )}
        </div>
    );
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function avatarTone(index: number): string {
    return [
        'bg-[var(--accent-blue)]',
        'bg-[var(--danger)]',
        'bg-[var(--success)]',
    ][index % 3];
}

function formatHours(hours: number): string {
    return Number(hours).toLocaleString('sk-SK', {
        maximumFractionDigits: 1,
    });
}

function formatShortDate(value: string): string {
    return new Date(value).toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'numeric',
    });
}
