import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: ReactNode;
    title: string;
    description?: string;
    onSubmit: (e: React.FormEvent) => void;
    processing: boolean;
    submitLabel?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: ReactNode;
}

export function FormDialog({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    onSubmit,
    processing,
    submitLabel = 'Uložiť',
    size = 'md',
    children,
}: FormDialogProps) {
    const sizeClass = {
        sm: 'sm:max-w-lg',
        md: 'sm:max-w-2xl',
        lg: 'sm:max-w-3xl',
        xl: 'sm:max-w-4xl',
    }[size];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

            <DialogContent
                className={`max-h-[90vh] overflow-x-hidden overflow-y-auto ${sizeClass}`}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={onSubmit} className="min-w-0">
                    <div className="grid min-w-0 gap-4 py-4 [&>*]:min-w-0">
                        {children}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Zrušiť
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Ukladám...' : submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
