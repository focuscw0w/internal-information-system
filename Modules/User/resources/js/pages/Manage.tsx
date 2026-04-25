import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CreateUserForm } from '../components/create-user-form';
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

            <div className="space-y-6 p-4 md:p-6">
                <HeadingSmall
                    title="Správa používateľov"
                />

                {status && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                    <CreateUserForm
                        availablePermissions={availablePermissions}
                    />
                    <UserTable
                        users={users}
                        availablePermissions={availablePermissions}
                        initialEditUserId={initialEditUserId}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
