import { DeleteDialog } from '@/components/dialogs/delete-dialog';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Project } from '../../../types/types';

interface DeleteProjectDialogProps {
    project: Project;
    text?: string;
}

export const DeleteProjectDialog = ({ project, text }: DeleteProjectDialogProps) => {
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
                    className={
                        text
                            ? 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[var(--danger-text)] transition-colors hover:bg-[var(--danger-soft)]'
                            : 'icon-btn hover:text-[var(--danger-text)]'
                    }
                    title="Zmazať projekt"
                >
                    <Trash2 className="h-4 w-4" />
                    {text && <span>{text}</span>}
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
