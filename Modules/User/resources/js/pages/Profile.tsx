import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Mail, Settings } from 'lucide-react';
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
        is_admin: boolean;
        created_at: string;
    };
    isOwnProfile: boolean;
    permissions: ProfilePermission[];
    projects: ProfileProject[];
    timeTracking: TimeTrackingSummary;
}

export default function Profile({
    user,
    isOwnProfile,
    permissions,
    projects,
    timeTracking,
}: ProfilePageProps) {
    const breadcrumbs: BreadcrumbItem[] = isOwnProfile
        ? [{ title: 'Môj profil', href: '/profile' }]
        : [
              { title: 'Používatelia', href: '/users' },
              { title: user.name, href: `/users/${user.id}` },
          ];

    const pageTitle = isOwnProfile ? 'Môj profil' : user.name;
    const totalAssigned = projects.reduce(
        (sum, project) => sum + project.tasks_assigned,
        0,
    );
    const totalCompleted = projects.reduce(
        (sum, project) => sum + project.tasks_completed,
        0,
    );
    const monthTarget = 168;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div className="page page-enter">
                <div className="profile-hero">
                    <div className="profile-hero__cover" />
                    <div className="profile-hero__body">
                        <span className="avatar avatar--lg bg-pink-600">
                            {user.name
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                        </span>
                        <div className="profile-hero__main">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="page-head__title">
                                    {user.name}
                                </h1>
                                {permissions.length > 0 && (
                                    <span className="badge badge--accent">
                                        {permissions[0].label}
                                    </span>
                                )}
                                <span className="badge badge--success">
                                    Aktívny
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                </span>
                                <span>
                                    V tíme od{' '}
                                    {new Date(user.created_at).toLocaleDateString(
                                        'sk-SK',
                                        { month: 'long', year: 'numeric' },
                                    )}
                                </span>
                                <span>Oddelenie: nepridané v DB</span>
                            </div>
                        </div>
                        <button type="button" className="btn btn--primary" disabled>
                            <Settings className="h-4 w-4" />
                            Upraviť profil
                        </button>
                    </div>
                </div>

                <div className="kpi-grid">
                    <div className="kpi">
                        <span className="kpi__label">Aktívne projekty</span>
                        <span className="kpi__value">{projects.length}</span>
                        <span className="kpi__delta">
                            Z projektových členstiev
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Otvorené úlohy</span>
                        <span className="kpi__value">
                            {Math.max(totalAssigned - totalCompleted, 0)}
                        </span>
                        <span className="kpi__delta kpi__delta--up">
                            {totalCompleted} dokončených
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Hodiny tento mesiac</span>
                        <span className="kpi__value">
                            {timeTracking.total_hours_this_month}
                            <sub>h / {monthTarget}h</sub>
                        </span>
                        <div className="progress mt-3">
                            <div
                                className="progress__fill"
                                style={{
                                    width: `${Math.min(
                                        (timeTracking.total_hours_this_month /
                                            monthTarget) *
                                            100,
                                        100,
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Včas dokončené</span>
                        <span className="kpi__value text-muted-foreground">
                            N/A
                        </span>
                        <span className="kpi__delta">
                            Placeholder, výpočet ešte nie je v logike
                        </span>
                    </div>
                </div>

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
