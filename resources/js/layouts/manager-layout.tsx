import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { ReactNode } from 'react';

type ManagerLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export default function ManagerLayout({
    children,
    breadcrumbs = [{ title: 'Manažér', href: '/manager' }],
}: ManagerLayoutProps) {
    return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
}
