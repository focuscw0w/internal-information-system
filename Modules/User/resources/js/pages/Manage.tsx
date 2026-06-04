import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, UserPlus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { PermissionList } from '../components/permission-list';
import { UserTable } from '../components/user-table';
import { AvailablePermissions, ManagedUser } from '../types/types';

interface ManageUsersPageProps {
    users: ManagedUser[];
    availablePermissions: AvailablePermissions;
    status?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Používatelia',
        href: '/users',
    },
];

export default function Manage({
    users,
    availablePermissions,
    status,
}: ManageUsersPageProps) {
    const { url } = usePage();
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const initialEditUserId = params.get('edit') ?? undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Používatelia" />

            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">
                            Správa používateľov
                        </h1>
                        <p className="page-head__subtitle">
                            Spravuj prístupy a oprávnenia členov tímu.
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <CreateUserDialog
                            availablePermissions={availablePermissions}
                        />
                    </div>
                </div>

                {status && (
                    <div className="rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success-text)]">
                        {status}
                    </div>
                )}

                <UserTable
                    users={users}
                    availablePermissions={availablePermissions}
                    initialEditUserId={initialEditUserId}
                />
            </div>
        </AppLayout>
    );
}

function CreateUserDialog({
    availablePermissions,
}: {
    availablePermissions: AvailablePermissions;
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        permissions: [] as string[],
    });

    const togglePermission = (permission: string) => {
        setData(
            'permissions',
            data.permissions.includes(permission)
                ? data.permissions.filter((item) => item !== permission)
                : [...data.permissions, permission],
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/users', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button type="button" className="btn btn--primary">
                    <UserPlus className="h-4 w-4" />
                    Pridať používateľa
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Pridať používateľa</DialogTitle>
                    <DialogDescription>
                        Vytvor konto a nastav oprávnenia, ktoré bude používateľ
                        potrebovať.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="create-user-name">Meno</Label>
                            <Input
                                id="create-user-name"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="Meno používateľa"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="create-user-email">Email</Label>
                            <Input
                                id="create-user-email"
                                type="email"
                                value={data.email}
                                onChange={(event) =>
                                    setData('email', event.target.value)
                                }
                                placeholder="user@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="create-user-password">Heslo</Label>
                            <Input
                                id="create-user-password"
                                type="password"
                                value={data.password}
                                onChange={(event) =>
                                    setData('password', event.target.value)
                                }
                                placeholder="Dočasné heslo"
                            />
                            <InputError message={errors.password} />
                        </div>
                    </div>

                    <PermissionList
                        onToggle={togglePermission}
                        availablePermissions={availablePermissions}
                        selected={data.permissions}
                        error={errors.permissions}
                    />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Vytvoriť používateľa
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
