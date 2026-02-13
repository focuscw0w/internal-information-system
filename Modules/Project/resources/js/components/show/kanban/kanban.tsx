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
import { Draggable } from './draggable';
import { Droppable } from './droppable';

interface KanbanProps {
    project: Project;
}

export function Kanban({ project }: KanbanProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

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
        const { active } = event;
        const task = project.tasks?.find((t) => t.id === active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveTask(null);

        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id as string;

        // Find the task being dragged
        const task = project.tasks?.find((t) => t.id === taskId);

        if (!task) return;

        if (task.status === newStatus) return;

        // Optimistically update the UI
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
                        <Droppable key={column.id} id={column.status}>
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
                                    {tasks.map((task) => (
                                        <Draggable key={task.id} id={task.id}>
                                            <Card className="cursor-grab transition-shadow hover:shadow-md active:cursor-grabbing">
                                                <CardContent className="p-3">
                                                    <h4 className="mb-2 text-sm font-medium text-gray-900">
                                                        {task.title}
                                                    </h4>
                                                    {task.assigned_user && (
                                                        <p className="text-xs text-gray-500">
                                                            👤{' '}
                                                            {
                                                                task
                                                                    .assigned_user
                                                                    .name
                                                            }
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-xs text-gray-500">
                                                            {task.actual_hours}h
                                                            /{' '}
                                                            {
                                                                task.estimated_hours
                                                            }
                                                            h
                                                        </span>
                                                        {task.priority ===
                                                            'high' && (
                                                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                                                Vysoká
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Draggable>
                                    ))}
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

            {/* Drag overlay - shows the task being dragged */}
            <DragOverlay>
                {activeTask ? (
                    <Card className="cursor-grabbing shadow-lg">
                        <CardContent className="p-3">
                            <h4 className="mb-2 text-sm font-medium text-gray-900">
                                {activeTask.title}
                            </h4>
                            {activeTask.assigned_user && (
                                <p className="text-xs text-gray-500">
                                    👤 {activeTask.assigned_user.name}
                                </p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {activeTask.actual_hours}h /{' '}
                                    {activeTask.estimated_hours}h
                                </span>
                                {activeTask.priority === 'high' && (
                                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                        Vysoká
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
