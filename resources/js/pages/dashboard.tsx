import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, CalendarCheck, Clock3 } from 'lucide-react';
import { AtRiskProjectsCard, type DashboardProject } from '../../../Modules/Project/resources/js/components/dashboard/at-risk-projects-card';
import { TasksTodayCard, type DashboardTask } from '../../../Modules/Project/resources/js/components/dashboard/tasks-today-card';
import { TimeWeekToDateCard, type TimeWeekToDate } from '../../../Modules/TimeTracking/resources/js/components/dashboard/time-week-to-date-card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    myTasksToday: DashboardTask[];
    atRiskProjects: DashboardProject[];
    timeWeekToDate: TimeWeekToDate;
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

                {/* Stat summary row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardDescription>Moje úlohy dnes</CardDescription>
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
                                <CardDescription>Rizikové projekty</CardDescription>
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
                                <CardDescription>Hodiny týždeň-to-date</CardDescription>
                                <CardTitle className="mt-2 text-3xl">
                                    {formatHours(timeWeekToDate.logged_hours)} h
                                </CardTitle>
                            </div>
                            <Clock3 className="h-8 w-8 text-emerald-500" />
                        </CardHeader>
                    </Card>
                </div>

                {/* Module cards */}
                <div className="grid gap-4 xl:grid-cols-3">
                    <TasksTodayCard tasks={myTasksToday} />
                    <TimeWeekToDateCard data={timeWeekToDate} />
                </div>

                <AtRiskProjectsCard projects={atRiskProjects} />
            </div>
        </AppLayout>
    );
}
