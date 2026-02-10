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
import { ReactNode } from 'react';

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: ReactNode;
    title: string;
    description: string | ReactNode;
    onConfirm: () => void;
    isDeleting: boolean;
    confirmLabel?: string;
}

export function DeleteDialog({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    onConfirm,
    isDeleting,
    confirmLabel = 'Zmazať',
}: DeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {trigger && (
                <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            )}

            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Zrušiť
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? 'Mažem...' : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
