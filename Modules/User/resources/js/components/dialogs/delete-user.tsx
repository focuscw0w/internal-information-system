import { DeleteDialog } from '@/components/dialogs/delete-dialog';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ManagedUser } from '../../types/types';

interface DeleteUserDialogProps {
    user: ManagedUser;
}

export const DeleteUserDialog = ({ user }: DeleteUserDialogProps) => {
    const [open, setOpen] = useState(false);

    const { delete: destroy, processing } = useForm({});

    const handleConfirm = () => {
        if (user.is_admin) return;

        destroy(`/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
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
                    title="Odstrániť používateľa"
                >
                    <Trash2 size={18} />
                </button>
            }
            title="Odstrániť používateľa?"
            description={
                <>
                    Naozaj chcete odstrániť používateľa{' '}
                    <strong>{user.name}</strong>? Táto akcia je nevratná.
                </>
            }
            onConfirm={handleConfirm}
            isDeleting={processing}
            confirmLabel="Odstrániť"
        />
    );
};