import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Project } from '../types/project.types';

interface ProjectDeleteDialogProps {
    project: Project;
}

export const ProjectDeleteDialog = ({ project }: ProjectDeleteDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(`/project/${project.id}`, {
            onSuccess: () => {
                setOpen(false);
                setIsDeleting(false);
            },
            onError: (errors) => {
                console.error('Delete error:', errors);
                setIsDeleting(false);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Zmazať projekt"
                >
                    <Trash2 size={18} />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Zmazať projekt?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Naozaj chcete zmazať projekt{' '}
                        <strong>{project.name}</strong>? Táto akcia je
                        nenávratná a všetky dáta budú natrvalo odstránené.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Zrušiť
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? 'Mažem...' : 'Zmazať projekt'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
