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
import { useForm } from '@inertiajs/react';
import { Subtask } from '../../../../types/types';

interface DeleteSubtaskDialogProps {
    subtask: Subtask;
    projectId: number;
    taskId: number;
    trigger: React.ReactNode;
}

export const DeleteSubtaskDialog = ({ subtask, projectId, taskId, trigger }: DeleteSubtaskDialogProps) => {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        destroy(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtask.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Odstrániť podúlohu</AlertDialogTitle>
                    <AlertDialogDescription>
                        Naozaj chcete odstrániť podúlohu „{subtask.title}"? Táto akcia sa nedá vrátiť.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Zrušiť</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={processing}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {processing ? 'Odstraňujem...' : 'Odstrániť'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
