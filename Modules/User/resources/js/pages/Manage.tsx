import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

interface ManagedUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface ManageUsersPageProps {
    users: ManagedUser[];
    status?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Používatelia',
        href: '/users',
    },
];

export default function Manage({ users, status }: ManageUsersPageProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/users', {
            preserveScroll: true,
            onSuccess: () => reset('name', 'email', 'password'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Používatelia" />

            <div className="space-y-6 p-4 md:p-6">
                <HeadingSmall
                    title="Správa používateľov"
                    description="Admin tu vytvára nové kontá. Používateľ sa potom prihlási klasicky emailom a heslom."
                />

                {status && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {status}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vytvoriť používateľa</CardTitle>
                            <CardDescription>
                                Minimalistický formulár pre admina.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Meno</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        placeholder="Meno používateľa"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
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
                                    <Label htmlFor="password">Heslo</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(event) =>
                                            setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Dočasné heslo"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Vytvoriť používateľa
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Existujúci používatelia</CardTitle>
                            <CardDescription>
                                Jednoduchý prehľad kont vytvorených v systéme.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b text-muted-foreground">
                                        <tr>
                                            <th className="py-3 pr-4 font-medium">
                                                Meno
                                            </th>
                                            <th className="py-3 pr-4 font-medium">
                                                Email
                                            </th>
                                            <th className="py-3 font-medium">
                                                Vytvorený
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-3 pr-4 font-medium">
                                                    {user.name}
                                                </td>
                                                <td className="py-3 pr-4 text-muted-foreground">
                                                    {user.email}
                                                </td>
                                                <td className="py-3 text-muted-foreground">
                                                    {new Date(
                                                        user.created_at,
                                                    ).toLocaleDateString(
                                                        'sk-SK',
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
