import { Button } from '@/components/ui/button';
import { Check, Trash2, X } from 'lucide-react';
import { Subtask } from '../../../types/types';
import { Column } from '@/components/ui/data-table';
import { EditSubtaskDialog } from '../dialogs/subtask/edit-subtask';
import { DeleteSubtaskDialog } from '../dialogs/subtask/delete-subtask';

interface SubtaskColumnsOptions {
    projectId: number;
    taskId: number;
    onToggle: (subtaskId: number) => void;
}

export const getSubtaskColumns = ({
                                      projectId,
                                      taskId,
                                      onToggle,
                                  }: SubtaskColumnsOptions): Column<Subtask>[] => [
    {
        key: 'title',
        label: 'Názov',
        render: (subtask) => (
            <span
                className={`text-sm ${
                    subtask.is_completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-900'
                }`}
            >
                {subtask.title}
            </span>
        ),
    },
    {
        key: 'status',
        label: 'Stav',
        width: 'w-28',
        align: 'center',
        render: (subtask) => (
            <button
                onClick={() => onToggle(subtask.id)}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-2 text-xs font-medium transition-colors ${
                    subtask.is_completed
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                {subtask.is_completed ? (
                    <>
                        <Check className="h-3 w-3" />
                        Hotovo
                    </>
                ) : (
                    <>
                        <X className="h-3 w-3" />
                        Nedokončené
                    </>
                )}
            </button>
        ),
    },
    {
        key: 'actions',
        label: 'Akcie',
        width: 'w-24',
        align: 'center',
        render: (subtask) => (
            <div className="flex items-center justify-center">
                <EditSubtaskDialog
                    subtask={subtask}
                    projectId={projectId}
                    taskId={taskId}
                />
                <DeleteSubtaskDialog
                    subtask={subtask}
                    projectId={projectId}
                    taskId={taskId}
                    trigger={
                        <Button variant="ghost" size="sm">
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                    }
                />
            </div>
        ),
    },
];
