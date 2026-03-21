import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Shield } from 'lucide-react';
import { AvailablePermissions, ManagedUser } from '../types/types';

interface ShowUserPageProps {
    user: ManagedUser;
    availablePermissions: AvailablePermissions;
}

export default function Show({
    user,
    availablePermissions,
}: ShowUserPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Používatelia', href: '/users' },
        { title: user.name, href: `/users/${user.id}` },
    ];

    const permissionLabels = Object.values(availablePermissions)
        .flat()
        .filter((p) => user.permissions.includes(p.value));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={user.name} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">
                                        Vytvorený
                                    </dt>
                                    <dd className="mt-0.5 font-medium">
                                        {new Date(
                                            user.created_at,
                                        ).toLocaleDateString('sk-SK', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Oprávnenia
                            </CardTitle>
                            <CardDescription>
                                Systémové oprávnenia pridelené tomuto
                                používateľovi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {permissionLabels.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {permissionLabels.map((perm) => (
                                        <Badge
                                            key={perm.value}
                                            variant="secondary"
                                        >
                                            {perm.label}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Žiadne oprávnenia.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}