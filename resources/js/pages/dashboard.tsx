import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    FolderKanban,
} from 'lucide-react';
import { type ComponentType } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardTask {
    id: number;
    project_id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    is_overdue: boolean;
    project: {
        id: number | null;
        name: string;
    };
}

interface DashboardProject {
    id: number;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
    is_overdue: boolean;
    days_remaining: number;
    at_risk_tasks_count: number;
    owner: {
        id: number | null;
        name: string;
    };
}

interface TimeWeekToDate {
    week_start: string;
    week_end: string;
    logged_hours: number;
    today_hours: number;
    entries_count: number;
    unsubmitted_hours: number;
    approved_hours: number;
    approval_enabled: boolean;
}

interface DashboardProps {
    myTasksToday: DashboardTask[];
    atRiskProjects: DashboardProject[];
    timeWeekToDate: TimeWeekToDate;
}

function formatDate(date: string | null) {
    if (!date) return 'Bez termínu';

    return new Intl.DateTimeFormat('sk-SK', {
        day: 'numeric',
        month: 'short',
    }).format(new Date(date));
}

function formatHours(hours: number) {
    return new Intl.NumberFormat('sk-SK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(hours);
}

export default function Dashboard({
    myTasksToday,
    atRiskProjects,
    timeWeekToDate,
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Rýchly prehľad naprieč projektmi, úlohami a sledovaním
                        času.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardDescription>
                                    Moje úlohy dnes
                                </CardDescription>
                                <CardTitle className="mt-2 text-3xl">
                                    {myTasksToday.length}
                                </CardTitle>
                            </div>
                            <CalendarCheck className="h-8 w-8 text-blue-500" />
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardDescription>
                                    Projekty at risk
                                </CardDescription>
                                <CardTitle className="mt-2 text-3xl">
                                    {atRiskProjects.length}
                                </CardTitle>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardDescription>
                                    Hodiny týždeň-to-date
                                </CardDescription>
                                <CardTitle className="mt-2 text-3xl">
                                    {formatHours(timeWeekToDate.logged_hours)} h
                                </CardTitle>
                            </div>
                            <Clock3 className="h-8 w-8 text-emerald-500" />
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between gap-3">
                            <div>
                                <CardTitle>Moje úlohy dnes</CardTitle>
                                <CardDescription>
                                    Úlohy priradené tebe s termínom dnes alebo
                                    po termíne.
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/projects">Otvoriť projekty</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {myTasksToday.length === 0 ? (
                                <EmptyState
                                    icon={CheckCircle2}
                                    title="Žiadne urgentné úlohy"
                                    description="Na dnes nemáš priradené žiadne otvorené úlohy."
                                />
                            ) : (
                                <div className="divide-y rounded-lg border">
                                    {myTasksToday.map((task) => (
                                        <Link
                                            key={task.id}
                                            href={`/projects/${task.project_id}/tasks/${task.id}`}
                                            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900">
                                                    {task.title}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {task.project.name}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge
                                                    variant={
                                                        task.is_overdue
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {formatDate(task.due_date)}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {task.priority}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hodiny týždeň-to-date</CardTitle>
                            <CardDescription>
                                Od {formatDate(timeWeekToDate.week_start)} do{' '}
                                {formatDate(timeWeekToDate.week_end)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MetricRow
                                label="Dnes"
                                value={`${formatHours(timeWeekToDate.today_hours)} h`}
                            />
                            <MetricRow
                                label="Tento týždeň"
                                value={`${formatHours(timeWeekToDate.logged_hours)} h`}
                            />
                            <MetricRow
                                label="Počet záznamov"
                                value={String(timeWeekToDate.entries_count)}
                            />
                            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                Approval workflow zatiaľ nie je v dátach
                                zapnutý, preto sa všetky WTD hodiny zobrazujú
                                ako neodoslané.
                            </div>
                            <MetricRow
                                label="Neodoslané"
                                value={`${formatHours(timeWeekToDate.unsubmitted_hours)} h`}
                            />
                            <MetricRow
                                label="Schválené"
                                value={`${formatHours(timeWeekToDate.approved_hours)} h`}
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link href="/time-tracking">
                                    Otvoriť time tracking
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Projekty at risk</CardTitle>
                        <CardDescription>
                            Aktívne projekty, ktoré meškajú alebo majú rizikové
                            otvorené úlohy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {atRiskProjects.length === 0 ? (
                            <EmptyState
                                icon={FolderKanban}
                                title="Žiadne rizikové projekty"
                                description="Tvoje projekty aktuálne nevyzerajú rizikovo."
                            />
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {atRiskProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900">
                                                    {project.name}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Owner: {project.owner.name}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    project.is_overdue
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {project.is_overdue
                                                    ? 'Po termíne'
                                                    : `${project.days_remaining} dní`}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 h-2 rounded-full bg-gray-100">
                                            <div
                                                className="h-2 rounded-full bg-amber-500"
                                                style={{
                                                    width: `${project.progress}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                {project.progress}% hotovo
                                            </span>
                                            <span>
                                                {project.at_risk_tasks_count}{' '}
                                                rizikových úloh
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function MetricRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <Icon className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">{title}</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
        </div>
    );
}
