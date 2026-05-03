import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Column, DataTable } from '@/components/ui/data-table';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Search, Shield, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AvailablePermissions, ManagedUser } from '../types/types';
import { DeleteUserDialog } from './dialogs/delete-user';
import { EditUserDialog } from './dialogs/edit-user';

interface UserTableProps {
    users: ManagedUser[];
    availablePermissions: AvailablePermissions;
    initialEditUserId?: string;
}

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

export const UserTable = ({ users, availablePermissions, initialEditUserId }: UserTableProps) => {
    const [search, setSearch] = useState('');
    const [adminFilter, setAdminFilter] = useState('');

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            if (
                query &&
                !`${user.name} ${user.email}`.toLowerCase().includes(query)
            ) {
                return false;
            }

            if (adminFilter === 'admin') return user.is_admin;
            if (adminFilter === 'user') return !user.is_admin;

            return true;
        });
    }, [adminFilter, search, users]);

    const hasFilters = Boolean(search || adminFilter);

    const columns: Column<ManagedUser>[] = [
        {
            key: 'name',
            label: 'Používateľ',
            render: (user) => (
                <div className="flex items-center gap-3">
                    <span className="avatar avatar--sm bg-pink-600">
                        {initials(user.name)}
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                    {user.is_admin && (
                                <Badge className="badge--warning text-xs">
                            <Shield className="h-3 w-3" />
                            Admin
                        </Badge>
                    )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {user.email}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Rola',
            render: (user) => (
                <span className="badge badge--neutral">
                    {user.is_admin ? 'Administrátor' : 'Používateľ'}
                </span>
            ),
        },
        {
            key: 'department',
            label: 'Oddelenie',
            render: () => (
                <span className="text-muted-foreground">Nepridané v DB</span>
            ),
        },
        {
            key: 'created_at',
            label: 'Vytvorený',
            render: (user) => (
                <span className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('sk-SK')}
                </span>
            ),
        },
        {
            key: '2fa',
            label: '2FA',
            render: () => (
                <span className="text-xs text-muted-foreground">N/A</span>
            ),
        },
        {
            key: 'actions',
            label: 'Akcie',
            align: 'center',
            render: (user) => (
                <div
                    className="flex items-center justify-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <EditUserDialog
                        user={user}
                        availablePermissions={availablePermissions}
                        initialOpen={String(user.id) === initialEditUserId}
                    />
                    {!user.is_admin && <DeleteUserDialog user={user} />}
                    <button type="button" className="icon-btn" disabled>
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Card>
            <CardHeader className="space-y-4">
                <CardTitle>Existujúci používatelia</CardTitle>
                <CardDescription>
                    Jednoduchý prehľad kont vytvorených v systéme.
                </CardDescription>
                <div className="command-bar">
                    <div className="field-wrap command-bar__search">
                        <Search className="h-4 w-4" />
                        <input
                            className="input input--with-icon w-full"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Hľadať podľa mena alebo e-mailu..."
                        />
                    </div>
                    <select
                        className="select text-xs"
                        value={adminFilter}
                        onChange={(event) => setAdminFilter(event.target.value)}
                    >
                        <option value="">Všetky role</option>
                        <option value="admin">Administrátori</option>
                        <option value="user">Používatelia</option>
                    </select>
                    {hasFilters && (
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                                setSearch('');
                                setAdminFilter('');
                            }}
                        >
                            <X className="h-3 w-3" />
                            Zrušiť filtre
                        </button>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {filteredUsers.length} z {users.length}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <DataTable
                    columns={columns}
                    data={filteredUsers}
                    keyExtractor={(user) => user.id}
                    onRowClick={(user) => router.visit(`/users/${user.id}`)}
                    emptyIcon={<Users className="h-8 w-8 text-gray-400" />}
                    emptyTitle="Žiadni používatelia"
                    emptyDescription="Vytvorte prvého používateľa pomocou formulára."
                />
            </CardContent>
        </Card>
    );
};
