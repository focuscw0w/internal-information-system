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
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { AvailablePermissions } from '../types/types';
import { PermissionList } from './permission-list';

interface CreateUserFormProps {
    availablePermissions: AvailablePermissions;
}

export const CreateUserForm = ({
    availablePermissions,
}: CreateUserFormProps) => {
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
                ? data.permissions.filter((p) => p !== permission)
                : [...data.permissions, permission],
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/users', {
            preserveScroll: true,
            onSuccess: () => reset('name', 'email', 'password', 'permissions'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vytvoriť používateľa</CardTitle>
                <CardDescription>
                    Minimalistický formulár pre admina.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    <div className="space-y-4">
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
    );
};