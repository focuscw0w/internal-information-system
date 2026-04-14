import { FormDialog } from '@/components/dialogs/form-dialog';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { AvailablePermissions, ManagedUser } from '../../types/types';
import { PermissionList } from '../permission-list';

interface EditUserDialogProps {
    user: ManagedUser;
    availablePermissions: AvailablePermissions;
    initialOpen?: boolean;
}

export const EditUserDialog = ({
    user,
    availablePermissions,
    initialOpen = false,
}: EditUserDialogProps) => {
    const [open, setOpen] = useState(initialOpen);

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        permissions: user.permissions ?? [],
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData({
                name: user.name,
                email: user.email,
                password: '',
                permissions: user.permissions ?? [],
            });
        }
        setOpen(newOpen);
    };

    const togglePermission = (permission: string) => {
        setData(
            'permissions',
            data.permissions.includes(permission)
                ? data.permissions.filter((p) => p !== permission)
                : [...data.permissions, permission],
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Upraviť používateľa"
                >
                    <Edit size={18} />
                </button>
            }
            title={`Upraviť používateľa – ${user.name}`}
            description="Zmena mena, emailu, hesla a oprávnení."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť zmeny"
        >
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor={`edit-name-${user.id}`}>Meno</Label>
                    <Input
                        id={`edit-name-${user.id}`}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                    <Input
                        id={`edit-email-${user.id}`}
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={`edit-password-${user.id}`}>
                        Nové heslo
                    </Label>
                    <Input
                        id={`edit-password-${user.id}`}
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Ponechať prázdne = bez zmeny"
                    />
                    <InputError message={errors.password} />
                </div>

                <PermissionList
                    onToggle={togglePermission}
                    availablePermissions={availablePermissions}
                    selected={data.permissions}
                    error={errors.permissions}
                />
            </div>
        </FormDialog>
    );
};
