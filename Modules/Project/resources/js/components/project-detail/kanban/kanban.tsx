import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useState } from 'react';
import { Project, Task } from '../../../types/types';
import { BlockedTaskDialog } from '../blocked-task-dialog';
import { Draggable } from './draggable';
import { Droppable } from './droppable';

interface KanbanProps {
    project: Project;
}

export function Kanban({ project }: KanbanProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);

    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

    const canEditTasks = can('edit_tasks');
    const canViewTasks = can('view_tasks');

    const columns = [
        { id: 'todo', title: 'Na vykonanie', status: 'todo' },
        { id: 'in_progress', title: 'Prebieha', status: 'in_progress' },
        { id: 'testing', title: 'Testovanie', status: 'testing' },
        { id: 'done', title: 'Hotovo', status: 'done' },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const getTasksByStatus = (status: string) => {
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
        const newStatus = over.id as string;

        const task = project.tasks?.find((t) => t.id === taskId);

        if (!task) return;
        if (task.status === newStatus) return;

        setPendingTaskId(Number(taskId));
        router.patch(
            `/projects/${project.id}/tasks/${taskId}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['project', 'flash'],
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

    const renderAssignedUsers = (task: Task) => {
        if (!task.assigned_users || task.assigned_users.length === 0)
            return null;

        return (
            <p className="text-xs text-gray-500">
                👤 {task.assigned_users.map((u) => u.name).join(', ')}
            </p>
        );
    };

    const renderBlockedBadge = (task: Task) => {
        if ((task.blocking_predecessors_count ?? 0) === 0) return null;
        return (
            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                Blokovaná ({task.blocking_predecessors_count})
            </span>
        );
    };

    const renderPriorityFlag = (task: Task) => {
        if (task.priority === 'urgent') {
            return (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    Urgentná
                </span>
            );
        }

        if (task.priority === 'high') {
            return (
                <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                    Vysoká
                </span>
            );
        }

        return null;
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {columns.map((column) => {
                    const tasks = getTasksByStatus(column.status);
                    return (
                        <Droppable
                            key={column.id}
                            id={column.status}
                            disabled={!canEditTasks}
                        >
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center justify-between text-sm font-semibold">
                                        {column.title}
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                                            {tasks.length}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {tasks.map((task) =>
                                        canEditTasks ? (
                                            <Draggable
                                                key={task.id}
                                                id={task.id}
                                            >
                                                <Card
                                                    className={`transition-shadow hover:shadow-md ${canViewTasks ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${task.is_at_risk ? 'border-l-4 border-l-orange-400' : ''}`}
                                                    onClick={() =>
                                                        handleTaskClick(task.id)
                                                    }
                                                >
                                                    <CardContent className="p-3">
                                                        <h4 className="mb-2 text-sm font-medium text-gray-900">
                                                            {task.title}
                                                        </h4>
                                                        {renderBlockedBadge(task)}
                                                        {renderAssignedUsers(
                                                            task,
                                                        )}
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">
                                                                {
                                                                    task.actual_hours
                                                                }
                                                                h /{' '}
                                                                {
                                                                    task.estimated_hours
                                                                }
                                                                h
                                                            </span>
                                                            {renderPriorityFlag(
                                                                task,
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Draggable>
                                        ) : (
                                            <Card
                                                key={task.id}
                                                className={`transition-shadow hover:shadow-md ${canViewTasks ? 'cursor-pointer' : 'cursor-default'} ${task.is_at_risk ? 'border-l-4 border-l-orange-400' : ''}`}
                                                onClick={() =>
                                                    handleTaskClick(task.id)
                                                }
                                            >
                                                <CardContent className="p-3">
                                                    <h4 className="mb-2 text-sm font-medium text-gray-900">
                                                        {task.title}
                                                    </h4>
                                                    {renderBlockedBadge(task)}
                                                    {renderAssignedUsers(task)}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-xs text-gray-500">
                                                            {task.actual_hours}h
                                                            /{' '}
                                                            {
                                                                task.estimated_hours
                                                            }
                                                            h
                                                        </span>
                                                        {renderPriorityFlag(
                                                            task,
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ),
                                    )}
                                    {tasks.length === 0 && (
                                        <p className="py-8 text-center text-sm text-gray-400">
                                            Žiadne úlohy
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </Droppable>
                    );
                })}
            </div>

            <BlockedTaskDialog
                projectId={project.id}
                taskId={pendingTaskId}
            />

            <DragOverlay>
                {activeTask ? (
                    <Card className="cursor-grabbing shadow-lg">
                        <CardContent className="p-3">
                            <h4 className="mb-2 text-sm font-medium text-gray-900">
                                {activeTask.title}
                            </h4>
                            {renderAssignedUsers(activeTask)}
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {activeTask.actual_hours}h /{' '}
                                    {activeTask.estimated_hours}h
                                </span>
                                {renderPriorityFlag(activeTask)}
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
