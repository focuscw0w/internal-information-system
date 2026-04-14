import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AlertsBanner } from '../components/dashboard/alerts-banner';
import { OverviewSection } from '../components/dashboard/overview-section';
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

export default function Index({
    dashboard,
    can_manage,
}: CapacityManagementPageProps) {
    const [capacities, setCapacities] = useState<Record<number, number>>({});
    const [expandedHistory, setExpandedHistory] = useState<
        Record<number, boolean>
    >({});
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

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Kapacitný manažment
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Prehľad ukazuje, kde tím nestíha, kto je preťažený a kde
                        je ešte priestor na zmenu.
                    </p>
                </div>

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

                <OverviewSection
                    weeklyOverview={dashboard.weekly_overview}
                    monthlyOverview={dashboard.monthly_overview}
                />

                <PredictionSection prediction={dashboard.prediction} />

                <PeopleCapacitySection
                    people={dashboard.people}
                    canManage={can_manage}
                    capacities={capacities}
                    expandedHistory={expandedHistory}
                    onCapacityChange={(userId, value) =>
                        setCapacities((prev) => ({
                            ...prev,
                            [userId]: value,
                        }))
                    }
                    onSubmitCapacity={updateCapacity}
                    onToggleHistory={(userId) =>
                        setExpandedHistory((prev) => ({
                            ...prev,
                            [userId]: !prev[userId],
                        }))
                    }
                />

                <section>
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
