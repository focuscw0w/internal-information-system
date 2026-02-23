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
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { Subtask } from '../../../../types/types';

interface DeleteSubtaskDialogProps {
    subtask: Subtask;
    projectId: number;
    taskId: number;
}

export const DeleteSubtaskDialog = ({
    subtask,
    projectId,
    taskId,
}: DeleteSubtaskDialogProps) => {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        destroy(
            `/projects/${projectId}/tasks/${taskId}/subtasks/${subtask.id}`,
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {' '}
                <Button variant="ghost" size="sm">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Odstrániť podúlohu</AlertDialogTitle>
                    <AlertDialogDescription>
                        Naozaj chcete odstrániť podúlohu „{subtask.title}"? Táto
                        akcia sa nedá vrátiť.
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
