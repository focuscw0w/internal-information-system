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

interface ModalProps {
    projectId: number;
    children: React.ReactNode;
}

export default function RemoveProjectModal({
    projectId,
    children,
}: ModalProps) {
    const { delete: destroy, processing } = useForm();

    function handleDelete() {
        destroy(`/projects/${projectId}`, {
            preserveScroll: true,
        });
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Naozaj chcete zmazať projekt?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Táto akcia je nezvratná.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Zrušiť</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={processing}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Zmazať
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
