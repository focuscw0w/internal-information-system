import { router } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { Task } from '../../../types/types';
import { CreateSubtaskDialog } from '../dialogs/subtask/create-subtask';

interface SubtaskTableProps {
    task: Task;
    projectId: number;
}

export const SubtaskTable = ({ task, projectId }: SubtaskTableProps) => {
    const subtasks = task.subtasks ?? [];
    const completed = subtasks.filter((subtask) => subtask.is_completed).length;

    const handleToggle = (subtaskId: number) => {
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
                    <p className="py-8 text-center text-sm text-muted-foreground">
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
                                    onChange={() => handleToggle(subtask.id)}
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
};
