import AppLayout from '@/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CheckCheck, Gauge, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

type ManagerLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

const hasAny = (permissions: string[], allowed: string[], isAdmin: boolean) =>
    isAdmin || allowed.some((permission) => permissions.includes(permission));

export default function ManagerLayout({
    children,
    breadcrumbs = [{ title: 'Manažér', href: '/manager' }],
}: ManagerLayoutProps) {
    const { url, props } = usePage<SharedData>();
    const permissions = (props.current_user_permissions as string[] | undefined) ?? [];
    const isAdmin = Boolean(props.auth.user?.is_admin);
    const canApprovals = hasAny(permissions, ['manage_time_entries'], isAdmin);
    const canReports = hasAny(permissions, ['manage_time_entries'], isAdmin);

    const links = [
        {
            href: '/manager',
            label: 'Dashboard',
            icon: LayoutDashboard,
            visible: true,
        },
        {
            href: '/manager/time/approvals',
            label: 'Approvals',
            icon: CheckCheck,
            visible: canApprovals,
        },
        {
            href: '/manager/time/reports',
            label: 'Reports',
            icon: BarChart3,
            visible: canReports,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="border-b border-border bg-card px-6 pt-4">
                <div className="mb-3 flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-[var(--accent-blue-text)]" />
                    <span className="text-sm font-semibold text-foreground">
                        Manager
                    </span>
                </div>
                <nav className="tabbar">
                    {links
                        .filter((link) => link.visible)
                        .map((link) => {
                            const Icon = link.icon;
                            const active =
                                url === link.href ||
                                (link.href !== '/manager' && url.startsWith(link.href));

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`tab ${active ? 'is-active' : ''}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                </nav>
            </div>
            {children}
        </AppLayout>
    );
}
