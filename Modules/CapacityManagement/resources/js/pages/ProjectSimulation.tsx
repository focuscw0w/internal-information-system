import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectSimControls } from '../components/simulation/project-sim-controls';
import { SimulationChartCard } from '../components/simulation/simulation-chart-card';
import { SimulationHeader } from '../components/simulation/simulation-header';
import { SimulationStatsGrid } from '../components/simulation/simulation-stats-grid';
import type { SimulationData, SimulationProject } from '../types/capacity';

const DEBOUNCE_MS = 300;

type ProjectSimulationPageProps = {
    project: SimulationProject;
    simulation: SimulationData;
    can_manage: boolean;
};

export default function ProjectSimulation({
    project,
    simulation,
    can_manage,
}: ProjectSimulationPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Kapacitný dashboard', href: '/capacity-management' },
        { title: 'Simulácia projektu', href: '#' },
    ];

    const [deadlineDaysShift, setDeadlineDaysShift] = useState(0);
    const [teamSize, setTeamSize] = useState(simulation.baseline_team_size);
    const [remainingHours, setRemainingHours] = useState(
        simulation.baseline_remaining_hours,
    );
    const [loading, setLoading] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSimulation = useCallback(
        (shift: number, size: number, hours: number) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                setLoading(true);

                router.post(
                    `/capacity-management/simulation/project/${project.id}/run`,
                    {
                        deadline_days_shift: shift,
                        team_size: size,
                        remaining_hours: hours,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        only: ['simulation'],
                        onFinish: () => setLoading(false),
                    },
                );
            }, DEBOUNCE_MS);
        },
        [project.id],
    );

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    if (!can_manage) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Simulácia projektu" />
                <div className="p-6 text-gray-500">
                    Nemáte oprávnenie na zobrazenie tejto stránky.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Simulácia – ${project.name}`} />

            <div className="space-y-4 p-6">
                <SimulationHeader projectName={project.name} />

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <ProjectSimControls
                        deadlineDaysShift={deadlineDaysShift}
                        teamSize={teamSize}
                        remainingHours={remainingHours}
                        baselineTeamSize={simulation.baseline_team_size}
                        baselineRemainingHours={
                            simulation.baseline_remaining_hours
                        }
                        onDeadlineChange={(days) => {
                            setDeadlineDaysShift(days);
                            runSimulation(days, teamSize, remainingHours);
                        }}
                        onTeamSizeChange={(size) => {
                            setTeamSize(size);
                            runSimulation(
                                deadlineDaysShift,
                                size,
                                remainingHours,
                            );
                        }}
                        onRemainingHoursChange={(hours) => {
                            setRemainingHours(hours);
                            runSimulation(deadlineDaysShift, teamSize, hours);
                        }}
                        onReset={() => {
                            setDeadlineDaysShift(0);
                            setTeamSize(simulation.baseline_team_size);
                            setRemainingHours(
                                simulation.baseline_remaining_hours,
                            );
                            runSimulation(
                                0,
                                simulation.baseline_team_size,
                                simulation.baseline_remaining_hours,
                            );
                        }}
                        loading={loading}
                    />

                    <div className="space-y-4">
                        <SimulationChartCard
                            points={simulation.burn_down_points}
                            loading={loading}
                        />
                        <SimulationStatsGrid simulation={simulation} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
