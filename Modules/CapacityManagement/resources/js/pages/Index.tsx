import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CalendarRange, Clock3, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AlertsBanner } from '../components/dashboard/alerts-banner';
import { PeopleCapacitySection } from '../components/dashboard/people-capacity-section';
import { PredictionSection } from '../components/dashboard/prediction-section';
import { RecommendationsSection } from '../components/dashboard/recommendations-section';
import { HistoryChart } from '../components/shared/history-chart';
import type { DashboardData } from '../types/capacity';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kapacitný dashboard', href: '/capacity-management' },
];

type ExpandedRecommendations = Record<'overloaded' | 'risky' | 'free', boolean>;

type CapacityManagementPageProps = {
    dashboard: DashboardData;
    can_manage: boolean;
};

type MetricCardProps = {
    title: string;
    value: string | number;
    subtitle: string;
    icon: typeof Clock3;
    iconClassName: string;
    iconBgClassName: string;
    progress?: number;
};

function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconClassName,
    iconBgClassName,
    progress,
}: MetricCardProps) {
    return (
        <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-3 text-sm font-medium text-gray-600">
                    <span className={`rounded-lg p-2 ${iconBgClassName}`}>
                        <Icon className={`h-5 w-5 ${iconClassName}`} />
                    </span>
                    {title}
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                {progress !== undefined && (
                    <Progress
                        value={Math.min(100, progress)}
                        className="mt-3 h-2 bg-gray-100"
                    />
                )}
            </CardContent>
        </Card>
    );
}

export default function Index({
    dashboard,
    can_manage,
}: CapacityManagementPageProps) {
    const [capacities, setCapacities] = useState<Record<number, number>>({});
    const [expandedPersonId, setExpandedPersonId] = useState<number | null>(
        null,
    );
    const [expandedRecommendations, setExpandedRecommendations] =
        useState<ExpandedRecommendations>({
            overloaded: true,
            risky: false,
            free: false,
        });

    const updateCapacity = (event: FormEvent, userId: number) => {
        event.preventDefault();

        router.patch(`/capacity-management/users/${userId}/capacity`, {
            weekly_capacity_hours:
                capacities[userId] ??
                dashboard.people.find((person) => person.id === userId)
                    ?.weekly_capacity_hours ??
                40,
        });
    };

    const overloadedPeople = dashboard.people
        .filter((person) => person.weekly_utilization > 100)
        .sort((a, b) => b.weekly_utilization - a.weekly_utilization);

    const totalFreeCapacity = dashboard.people.reduce(
        (sum, person) => sum + person.free_capacity_hours,
        0,
    );

    const riskyProjects = dashboard.prediction.projects
        .filter((project) => !project.can_finish && !project.is_overdue)
        .sort(
            (a, b) =>
                b.remaining_hours -
                b.available_hours_next_4_weeks -
                (a.remaining_hours - a.available_hours_next_4_weeks),
        );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kapacitný dashboard" />

            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Kapacitný manažment
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Prehľad ukazuje, kde tím nestíha, kto je preťažený a kde
                        je ešte priestor na zmenu.
                    </p>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title="Týždenné vyťaženie"
                        value={`${dashboard.weekly_overview.utilization}%`}
                        subtitle={`${dashboard.weekly_overview.load_hours}h z ${dashboard.weekly_overview.capacity_hours}h`}
                        icon={Clock3}
                        iconClassName="text-blue-600"
                        iconBgClassName="bg-blue-100"
                        progress={dashboard.weekly_overview.utilization}
                    />
                    <MetricCard
                        title="Mesačné vyťaženie"
                        value={`${dashboard.monthly_overview.utilization}%`}
                        subtitle={`${dashboard.monthly_overview.load_hours}h z ${dashboard.monthly_overview.capacity_hours}h`}
                        icon={CalendarRange}
                        iconClassName="text-violet-600"
                        iconBgClassName="bg-violet-100"
                        progress={dashboard.monthly_overview.utilization}
                    />
                    <MetricCard
                        title="Nad kapacitou"
                        value={overloadedPeople.length}
                        subtitle={`${dashboard.people.length} ľudí v tíme`}
                        icon={AlertTriangle}
                        iconClassName="text-red-600"
                        iconBgClassName="bg-red-100"
                    />
                    <MetricCard
                        title="Voľná kapacita"
                        value={`${Math.round(totalFreeCapacity)}h`}
                        subtitle={`${dashboard.free_people.length} ľudí pod 80%`}
                        icon={Users}
                        iconClassName="text-emerald-600"
                        iconBgClassName="bg-emerald-100"
                    />
                </section>

                <AlertsBanner alerts={dashboard.alerts} />

                <RecommendationsSection
                    overloadedPeople={overloadedPeople}
                    riskyProjects={riskyProjects}
                    freePeople={dashboard.free_people}
                    expandedRecommendations={expandedRecommendations}
                    onToggleRecommendation={(key) =>
                        setExpandedRecommendations((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                        }))
                    }
                />

                <PeopleCapacitySection
                    people={dashboard.people}
                    canManage={can_manage}
                    capacities={capacities}
                    expandedPersonId={expandedPersonId}
                    onCapacityChange={(userId, value) =>
                        setCapacities((prev) => ({
                            ...prev,
                            [userId]: value,
                        }))
                    }
                    onSubmitCapacity={updateCapacity}
                    onToggleHistory={(userId) =>
                        setExpandedPersonId((current) =>
                            current === userId ? null : userId,
                        )
                    }
                />

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
                    <PredictionSection prediction={dashboard.prediction} />

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                História využitia kapacity tímu (12 týždňov)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <HistoryChart
                                data={dashboard.history}
                                height={200}
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
