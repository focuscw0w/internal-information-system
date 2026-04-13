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
import { Shield, Users } from 'lucide-react';
import { AvailablePermissions, ManagedUser } from '../types/types';
import { DeleteUserDialog } from './dialogs/delete-user';
import { EditUserDialog } from './dialogs/edit-user';

interface UserTableProps {
    users: ManagedUser[];
    availablePermissions: AvailablePermissions;
}

export const UserTable = ({ users, availablePermissions }: UserTableProps) => {
    const columns: Column<ManagedUser>[] = [
        {
            key: 'name',
            label: 'Meno',
            render: (user) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {user.is_admin && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: (user) => (
                <span className="text-muted-foreground">{user.email}</span>
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
                    />
                    {!user.is_admin && <DeleteUserDialog user={user} />}
                </div>
            ),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Existujúci používatelia</CardTitle>
                <CardDescription>
                    Jednoduchý prehľad kont vytvorených v systéme.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={users}
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
