import AuthenticatedSessionController from '@/actions/Modules/User/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
}

export default function Login({ status }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Prihlásenie" />

            <main className="min-h-svh bg-background">
                <section className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-8 sm:px-10 lg:px-14">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 self-start"
                    >
                        <span className="grid size-7 place-items-center rounded-[7px] bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-secondary)] text-sm font-bold tracking-tight text-white">
                            A
                        </span>
                        <span className="text-sm font-semibold tracking-tight text-foreground">
                            Atlas
                            <span className="block text-[10.5px] font-normal tracking-normal text-muted-foreground">
                                Internal Information System
                            </span>
                        </span>
                    </Link>

                    <div className="flex flex-1 items-center justify-center py-12">
                        <div className="w-full max-w-[380px]">
                            <div>
                                <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-foreground">
                                    Prihlásenie
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Zadaj svoj firemný e-mail a heslo.
                                </p>
                            </div>

                            <Form
                                {...AuthenticatedSessionController.store.form()}
                                resetOnSuccess={['password']}
                                className="mt-7 flex flex-col gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="email"
                                                className="text-xs font-medium text-[var(--text-secondary)]"
                                            >
                                                E-mail
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="adam.kovac@atlas.sk"
                                                className="h-[38px]"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <div className="flex items-baseline justify-between gap-3">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-xs font-medium text-[var(--text-secondary)]"
                                                >
                                                    Heslo
                                                </Label>
                                                <Link
                                                    href="/forgot-password"
                                                    className="text-xs font-medium text-[var(--accent-blue-text)] underline-offset-4 hover:underline"
                                                    tabIndex={5}
                                                >
                                                    Zabudli ste heslo?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="••••••••"
                                                    className="h-[38px] pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (visible) =>
                                                                !visible,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    aria-label={
                                                        showPassword
                                                            ? 'Skryť heslo'
                                                            : 'Zobraziť heslo'
                                                    }
                                                    tabIndex={3}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="size-4" />
                                                    ) : (
                                                        <Eye className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={4}
                                            />
                                            <span>
                                                Zapamätať si ma na tomto
                                                zariadení
                                            </span>
                                        </label>

                                        <Button
                                            type="submit"
                                            className="mt-2 h-10 w-full text-sm"
                                            tabIndex={6}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing ? (
                                                <>
                                                    <LoaderCircle className="size-4 animate-spin" />
                                                    Prihlasujem...
                                                </>
                                            ) : (
                                                'Prihlásiť sa'
                                            )}
                                        </Button>
                                    </>
                                )}
                            </Form>

                            <div className="mt-7 rounded-md border border-border bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
                                <div className="mb-1 flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                                    <LockKeyhole className="size-3" />
                                    Single sign-on
                                </div>
                                Alebo sa prihlás cez{' '}
                                <span className="font-medium text-[var(--accent-blue-text)]">
                                    firemný SSO
                                </span>
                                .
                            </div>

                            {status && (
                                <div className="mt-4 rounded-md border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-3 text-center text-sm font-medium text-[var(--success-text)]">
                                    {status}
                                </div>
                            )}

                            <p className="mt-8 text-center text-xs text-muted-foreground">
                                © 2026 Atlas · v2.4.1
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
