import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { ListChecks, Pencil, Trash2 } from 'lucide-react';
import { Task } from '../../../types/types';
import { CreateSubtaskDialog } from '../dialogs/subtask/create-subtask';
import { DeleteSubtaskDialog } from '../dialogs/subtask/delete-subtask';
import { EditSubtaskDialog } from '../dialogs/subtask/edit-subtask';

interface SubtasksProps {
    task: Task;
    projectId: number;
}

export const Subtasks = ({ task, projectId }: SubtasksProps) => {
    const subtasks = task.subtasks ?? [];
    const completed = subtasks.filter((s) => s.is_completed).length;

    const handleToggle = (subtaskId: number) => {
        router.patch(
            `/projects/${projectId}/tasks/${task.id}/subtasks/${subtaskId}/toggle`,
            {},
            { preserveScroll: true },
        );
    };

    console.log(task)

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <CreateSubtaskDialog projectId={projectId} taskId={task.id} />
            </div>

            <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">
                        Podúlohy
                        {subtasks.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({completed}/{subtasks.length})
                            </span>
                        )}
                    </CardTitle>
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
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                                    <th className="w-10 pb-3" />
                                    <th className="pb-3">Názov</th>
                                    <th className="w-24 pb-3 text-right">
                                        Akcie
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {subtasks.map((subtask) => (
                                    <tr
                                        key={subtask.id}
                                        className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                                    >
                                        <td className="py-3 pr-2">
                                            <input
                                                type="checkbox"
                                                checked={subtask.is_completed}
                                                onChange={() =>
                                                    handleToggle(subtask.id)
                                                }
                                                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
                                            />
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`text-sm ${
                                                    subtask.is_completed
                                                        ? 'text-gray-400 line-through'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                {subtask.title}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <EditSubtaskDialog
                                                    subtask={subtask}
                                                    projectId={projectId}
                                                    taskId={task.id}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 text-gray-400" />
                                                        </Button>
                                                    }
                                                />
                                                <DeleteSubtaskDialog
                                                    subtask={subtask}
                                                    projectId={projectId}
                                                    taskId={task.id}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
