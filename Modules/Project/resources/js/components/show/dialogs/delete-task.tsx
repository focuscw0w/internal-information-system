import { DeleteDialog } from '@/components/dialogs/delete-dialog';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Task } from '../../../types/types';

interface DeleteTaskDialogProps {
    task: Task;
    projectId: number;
}

export const DeleteTaskDialog = ({
    task,
    projectId,
}: DeleteTaskDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/projects/${projectId}/tasks/${task.id}`, {
            onSuccess: () => {
                setOpen(false);
                setIsDeleting(false);
            },
            onError: () => setIsDeleting(false),
        });
    };

    return (
        <DeleteDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Zmazať úlohu"
                >
                    <Trash2 size={18} />
                </button>
            }
            title="Zmazať úlohu?"
            description={
                <>
                    Naozaj chcete zmazať úlohu <strong>{task.title}</strong>?
                    Táto akcia je nenávratná a všetky dáta budú natrvalo
                    odstránené.
                </>
            }
            onConfirm={handleDelete}
            isDeleting={isDeleting}
            confirmLabel="Zmazať úlohu"
        />
    );
};
