import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Download, Shield, UserPlus, Users } from 'lucide-react';
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
    const adminCount = users.filter((user) => user.is_admin).length;

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
                            Spravuj prístupy, roly a oprávnenia členov tímu.
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <button type="button" className="btn" disabled>
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                        <button type="button" className="btn" disabled>
                            <Users className="h-4 w-4" />
                            Skupiny a role
                        </button>
                        <button type="button" className="btn btn--primary" disabled>
                            <UserPlus className="h-4 w-4" />
                            Pozvať používateľa
                        </button>
                    </div>
                </div>

                {status && (
                    <div className="rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success-text)]">
                        {status}
                    </div>
                )}

                <div className="kpi-grid">
                    <div className="kpi">
                        <span className="kpi__label">Celkom používateľov</span>
                        <span className="kpi__value">{users.length}</span>
                        <span className="kpi__delta">
                            Dáta z používateľskej databázy
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Administrátori</span>
                        <span className="kpi__value">{adminCount}</span>
                        <span className="kpi__delta">S plným prístupom</span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Bežní používatelia</span>
                        <span className="kpi__value">
                            {users.length - adminCount}
                        </span>
                        <span className="kpi__delta">S oprávneniami</span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Bez 2FA</span>
                        <span className="kpi__value text-muted-foreground">
                            N/A
                        </span>
                        <span className="kpi__delta kpi__delta--down">
                            Placeholder, DB pole ešte neexistuje
                        </span>
                    </div>
                </div>

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
