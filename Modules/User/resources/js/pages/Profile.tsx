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
import { Head, Link } from '@inertiajs/react';
import {
    Clock,
    FolderOpen,
    Mail,
    Shield,
    User as UserIcon,
} from 'lucide-react';

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
                    {/* Osobné údaje */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Osobné údaje
                            </CardTitle>
                            <CardDescription>
                                Zmenu údajov vykonáva administrátor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">
                                        Meno
                                    </dt>
                                    <dd className="mt-0.5 font-medium">
                                        {user.name}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Email
                                    </dt>
                                    <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        {user.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Účet vytvorený
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

                    {/* Oprávnenia */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Systémové oprávnenia
                            </CardTitle>
                            <CardDescription>
                                Oprávnenia pridelené administrátorom.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {permissions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {permissions.map((perm) => (
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
                                    Žiadne systémové oprávnenia.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Projekty */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Moje projekty
                        </CardTitle>
                        <CardDescription>
                            Projekty, v ktorých som členom tímu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {projects.length > 0 ? (
                            <div className="space-y-3">
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-gray-50/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {project.name}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {project.role}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            <p>
                                                {project.tasks_completed}/
                                                {project.tasks_assigned} úloh
                                                dokončených
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Nie ste členom žiadneho projektu.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Time Tracking */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Prehľad času
                        </CardTitle>
                        <CardDescription>
                            Odpracovaný čas tento týždeň a mesiac.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-6">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Tento týždeň
                                </p>
                                <p className="text-2xl font-semibold">
                                    {timeTracking.total_hours_this_week}h
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Tento mesiac
                                </p>
                                <p className="text-2xl font-semibold">
                                    {timeTracking.total_hours_this_month}h
                                </p>
                            </div>
                        </div>

                        {timeTracking.recent_entries.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Posledné záznamy
                                </p>
                                <div className="space-y-1.5">
                                    {timeTracking.recent_entries.map(
                                        (entry) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm leading-tight font-medium">
                                                        {entry.task_title}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {entry.project_name}
                                                        {entry.description &&
                                                            ` · ${entry.description}`}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-sm font-medium">
                                                        {entry.hours}h
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            entry.entry_date,
                                                        ).toLocaleDateString(
                                                            'sk-SK',
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
