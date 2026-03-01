import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { Filter, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { Subtask, Task } from '../../../types/types';
import { CreateSubtaskDialog } from '../dialogs/subtask/create-subtask';
import { DataTable } from '@/components/ui/data-table';
import { getSubtaskColumns } from './subtask-columns';
import { CompletionFilter, SubtaskFilters } from './subtask-filters';

interface SubtaskTableProps {
    task: Task;
    projectId: number;
}

export const SubtaskTable = ({ task, projectId }: SubtaskTableProps) => {
    const [completionFilter, setCompletionFilter] =
        useState<CompletionFilter>('all');

    const allSubtasks = task.subtasks ?? [];
    const completed = allSubtasks.filter((s) => s.is_completed).length;

    const subtasks = allSubtasks.filter((s) => {
        if (completionFilter === 'completed') return s.is_completed;
        if (completionFilter === 'incomplete') return !s.is_completed;
        return true;
    });

    const handleToggle = (subtaskId: number) => {
        router.patch(
            `/projects/${projectId}/tasks/${task.id}/subtasks/${subtaskId}/toggle`,
            {},
            { preserveScroll: true },
        );
    };

    const columns = getSubtaskColumns({
        projectId,
        taskId: task.id,
        onToggle: handleToggle,
    });

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">
                            Podúlohy
                            {allSubtasks.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({completed}/{allSubtasks.length})
                                </span>
                            )}
                        </CardTitle>

                        {allSubtasks.length > 0 && (
                            <SubtaskFilters
                                completionFilter={completionFilter}
                                filteredCount={subtasks.length}
                                totalCount={allSubtasks.length}
                                onChange={setCompletionFilter}
                            />
                        )}
                    </div>
                    <CreateSubtaskDialog
                        projectId={projectId}
                        taskId={task.id}
                    />
                </CardHeader>
                <CardContent>
                    <DataTable<Subtask>
                        columns={columns}
                        data={subtasks}
                        keyExtractor={(s) => s.id}
                        emptyIcon={
                            completionFilter !== 'all' ? (
                                <Filter className="h-10 w-10 text-gray-300" />
                            ) : (
                                <ListChecks className="h-10 w-10 text-gray-300" />
                            )
                        }
                        emptyTitle={
                            completionFilter !== 'all'
                                ? 'Žiadne podúlohy nezodpovedajú filtru.'
                                : 'Zatiaľ žiadne podúlohy.'
                        }
                        emptyDescription={
                            completionFilter === 'all'
                                ? 'Rozdeľte úlohu na menšie časti pre lepšie sledovanie.'
                                : undefined
                        }
                        emptyAction={
                            completionFilter !== 'all' ? (
                                <button
                                    onClick={() => setCompletionFilter('all')}
                                    className="text-sm text-blue-500 hover:underline"
                                >
                                    Zrušiť filter
                                </button>
                            ) : undefined
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
};
