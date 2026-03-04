import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { TimerWidget } from '../../../Modules/TimeTracking/resources/js/components/time-entry-table/timer-widget';
import { TimerProvider } from '../../../Modules/TimeTracking/resources/js/context/timer-context';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        <TimerProvider>
            {children} <TimerWidget />
        </TimerProvider>
    </AppLayoutTemplate>
);
