import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { UserProjectsCard } from '../../../../Project/resources/js/components/profile/user-projects-card';
import { UserTimeTrackingCard } from '../../../../TimeTracking/resources/js/components/profile/user-time-tracking-card';
import { UserInfoCard } from '../components/profile/user-info-card';
import { UserPermissionsCard } from '../components/profile/user-permissions-card';

interface ProfilePermission {
    value: string;
    label: string;
}

interface ProfileProject {
    id: number;
    name: string;
    role: string;
    permissions: string[];
    tasks_assigned: number;
    tasks_completed: number;
}

interface TimeTrackingSummary {
    total_hours_this_week: number;
    total_hours_this_month: number;
    recent_entries: {
        id: number;
        project_name: string;
        task_title: string;
        hours: number;
        entry_date: string;
        description: string | null;
    }[];
}

interface ProfilePageProps {
    user: {
        id: number;
        name: string;
        email: string;
        created_at: string;
    };
    permissions: ProfilePermission[];
    projects: ProfileProject[];
    timeTracking: TimeTrackingSummary;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Môj profil', href: '/profile' },
];

export default function Profile({
    user,
    permissions,
    projects,
    timeTracking,
}: ProfilePageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Môj profil" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <UserInfoCard user={user} />
                    <UserPermissionsCard permissions={permissions} />
                </div>

                <UserProjectsCard projects={projects} />
                <UserTimeTrackingCard summary={timeTracking} />
            </div>
        </AppLayout>
    );
}
