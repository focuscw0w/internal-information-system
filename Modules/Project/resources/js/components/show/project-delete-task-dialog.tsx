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
import { Task } from '../../types/project.types';

interface ProjectTaskDeleteDialogProps {
    task: Task;
    projectId: number;
}

export const ProjectTaskDeleteDialog = ({ task, projectId }: ProjectTaskDeleteDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/projects/${projectId}/tasks/${task.id}`, {  
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
                    title="Zmazať úlohu"
                >
                    <Trash2 size={18} />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Zmazať úlohu?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Naozaj chcete zmazať úlohu{' '}
                        <strong>{task.title}</strong>? Táto akcia je
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
                        {isDeleting ? 'Mažem...' : 'Zmazať úlohu'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};