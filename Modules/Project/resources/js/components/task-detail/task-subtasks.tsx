import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';
import { Project, Task } from '../../types/types';

interface TaskSubtasksProps {
    task: Task;
    project: Project;
}

export const TaskSubtasks = ({ task, project }: TaskSubtasksProps) => {
    const subtasks = task.subtasks ?? [];
    const completed = subtasks.filter((s) => s.status === 'done').length;

    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Podúlohy
                        {subtasks.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({completed}/{subtasks.length})
                            </span>
                        )}
                    </CardTitle>
                    {/* TODO: CreateSubtaskDialog */}
                </div>
            </CardHeader>
            <CardContent>
                {subtasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <ListChecks className="mb-3 h-10 w-10 text-gray-300" />
                        <p className="text-sm text-gray-500">
                            Zatiaľ žiadne podúlohy.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Rozdeľte úlohu na menšie časti pre lepšie
                            sledovanie.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {subtasks.map((subtask) => (
                            <div
                                key={subtask.id}
                                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/30 p-3 transition-colors hover:bg-gray-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={subtask.status === 'done'}
                                    readOnly
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                />
                                <span
                                    className={`flex-1 text-sm ${
                                        subtask.status === 'done'
                                            ? 'text-gray-400 line-through'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {subtask.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
