import { DeleteDialog } from '@/components/dialogs/delete-dialog';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Project } from '../../../types/types';

interface DeleteProjectDialogProps {
    project: Project;
}

export const DeleteProjectDialog = ({ project }: DeleteProjectDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/projects/${project.id}`, {
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
                    title="Zmazať projekt"
                >
                    <Trash2 size={20} />
                </button>
            }
            title="Zmazať projekt?"
            description={
                <>
                    Naozaj chcete zmazať projekt <strong>{project.name}</strong>
                    ? Táto akcia je nenávratná a všetky dáta budú natrvalo
                    odstránené.
                </>
            }
            onConfirm={handleDelete}
            isDeleting={isDeleting}
            confirmLabel="Zmazať projekt"
        />
    );
};
