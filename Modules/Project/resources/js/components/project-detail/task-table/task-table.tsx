import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { CircleDashed, Filter } from 'lucide-react';
import { useState } from 'react';
import { Project, Task, TaskPriority, TaskStatus } from '../../../types/types';
import { Column, DataTable } from '@/components/ui/data-table';
import { CreateTaskDialog } from './dialogs/create-task';
import { TaskActions } from './task-actions';
import { TaskColumns } from './task-columns';
import { TaskFilters } from './task-filters';

interface TaskTableProps {
    project: Project;
}

export const TaskTable = ({ project }: TaskTableProps) => {
    const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(
        null,
    );
    const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);

    const hasActiveFilters = !!(
        statusFilter ||
        priorityFilter ||
        assigneeFilter
    );

    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

    const clearFilters = () => {
        setStatusFilter(null);
        setPriorityFilter(null);
        setAssigneeFilter(null);
    };

    const allTasks = project.tasks ?? [];

    const assignees = allTasks
        .flatMap((t) => t.assigned_users ?? [])
        .filter((u, i, arr) => arr.findIndex((a) => a.id === u.id) === i);

    const tasks = allTasks.filter((task) => {
        if (statusFilter && task.status !== statusFilter) return false;
        if (priorityFilter && task.priority !== priorityFilter) return false;
        if (
            assigneeFilter &&
            !(task.assigned_users ?? []).some((u) => u.id === assigneeFilter)
        )
            return false;
        return true;
    });

    const allColumns: Column<Task>[] = [
        ...TaskColumns,
        ...(can('edit_tasks')
            ? [
                  {
                      key: 'actions',
                      label: 'Akcie',
                      width: 'w-16',
                      align: 'center' as const,
                      render: (task: Task) => (
                          <div onClick={(e) => e.stopPropagation()}>
                              <TaskActions
                                  task={task}
                                  project={project}
                                  team={project.team}
                              />
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Úlohy
                        {allTasks.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({project.tasks_completed}/{project.tasks_total}
                                )
                            </span>
                        )}
                    </CardTitle>
                    <CreateTaskDialog
                        projectId={project.id}
                        team={project.team}
                    />
                </div>

                {allTasks.length > 0 && (
                    <TaskFilters
                        statusFilter={statusFilter}
                        priorityFilter={priorityFilter}
                        assigneeFilter={assigneeFilter}
                        assignees={assignees}
                        filteredCount={tasks.length}
                        totalCount={allTasks.length}
                        onStatusChange={setStatusFilter}
                        onPriorityChange={setPriorityFilter}
                        onAssigneeChange={setAssigneeFilter}
                        onClear={clearFilters}
                    />
                )}
            </CardHeader>
            <CardContent>
                <DataTable<Task>
                    columns={allColumns}
                    data={tasks}
                    keyExtractor={(task) => task.id}
                    onRowClick={(task) =>
                        router.visit(`/projects/${project.id}/tasks/${task.id}`)
                    }
                    emptyIcon={
                        hasActiveFilters ? (
                            <Filter className="h-10 w-10 text-gray-300" />
                        ) : (
                            <CircleDashed className="h-12 w-12 text-gray-300" />
                        )
                    }
                    emptyTitle={
                        hasActiveFilters
                            ? 'Žiadne úlohy nezodpovedajú filtrom.'
                            : 'Zatiaľ nie sú vytvorené žiadne úlohy'
                    }
                    emptyAction={
                        hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-500 hover:underline"
                            >
                                Zrušiť filtre
                            </button>
                        ) : (
                            <CreateTaskDialog
                                projectId={project.id}
                                team={project.team}
                            />
                        )
                    }
                />
            </CardContent>
        </Card>
    );
};
