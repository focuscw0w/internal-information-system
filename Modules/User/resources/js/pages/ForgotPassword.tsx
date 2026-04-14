import PasswordResetLinkController from '@/actions/Modules/User/Http/Controllers/PasswordResetLinkController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    return (
        <AuthLayout
            title="Zabudnuté heslo"
            description="Zadajte váš email a správca systému dostane notifikáciu o resete hesla."
        >
            <Head title="Zabudnuté heslo" />

            {status && (
                <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            <Form
                {...PasswordResetLinkController.store.form()}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email adresa</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="email"
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <Button type="submit" disabled={processing} className="w-full">
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Odoslať žiadosť
                        </Button>

                        <div className="text-center text-sm">
                            <Link
                                href="/login"
                                className="underline underline-offset-4"
                            >
                                Späť na prihlásenie
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
