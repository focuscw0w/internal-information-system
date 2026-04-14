import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BurnDownChart } from '../components/simulation/BurnDownChart';
import { ProjectSimControls } from '../components/simulation/ProjectSimControls';

type BurnDownPoint = {
    week_label: string;
    ideal_remaining: number;
    forecast_remaining: number;
    is_deadline_week: boolean;
};

type SimulationData = {
    project_id: number;
    project_name: string;
    baseline_deadline: string;
    simulated_deadline: string;
    baseline_remaining_hours: number;
    simulated_remaining_hours: number;
    baseline_weekly_capacity: number;
    simulated_weekly_capacity: number;
    baseline_team_size: number;
    simulated_team_size: number;
    forecast_finish_date: string | null;
    finish_diff_days: number | null;
    will_meet_deadline: boolean;
    burn_down_points: BurnDownPoint[];
};

type Props = {
    project: { id: number; name: string; status: string };
    simulation: SimulationData;
    can_manage: boolean;
};

const DEBOUNCE_MS = 300;

export default function ProjectSimulation({ project, simulation, can_manage }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Kapacitný dashboard', href: '/capacity-management' },
        { title: 'Simulácia projektu', href: '#' },
    ];

    // Slider state — initialised from baseline values
    const [deadlineDaysShift, setDeadlineDaysShift] = useState(0);
    const [teamSize, setTeamSize] = useState(simulation.baseline_team_size);
    const [remainingHours, setRemainingHours] = useState(simulation.baseline_remaining_hours);
    const [loading, setLoading] = useState(false);

    // Keep a ref to the debounce timer
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSimulation = useCallback(
        (shift: number, size: number, hours: number) => {
            if (timerRef.current) clearTimeout(timerRef.current);

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

    const handleDeadlineChange = (days: number) => {
        setDeadlineDaysShift(days);
        runSimulation(days, teamSize, remainingHours);
    };

    const handleTeamSizeChange = (size: number) => {
        setTeamSize(size);
        runSimulation(deadlineDaysShift, size, remainingHours);
    };

    const handleRemainingHoursChange = (hours: number) => {
        setRemainingHours(hours);
        runSimulation(deadlineDaysShift, teamSize, hours);
    };

    const handleReset = () => {
        setDeadlineDaysShift(0);
        setTeamSize(simulation.baseline_team_size);
        setRemainingHours(simulation.baseline_remaining_hours);
        runSimulation(0, simulation.baseline_team_size, simulation.baseline_remaining_hours);
    };

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    if (!can_manage) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Simulácia projektu" />
                <div className="p-6 text-gray-500">Nemáte oprávnenie na zobrazenie tejto stránky.</div>
            </AppLayout>
        );
    }

    const finishDiff = simulation.finish_diff_days;
    const finishDiffLabel =
        finishDiff === null
            ? 'Nedokončiteľné (kapacita = 0)'
            : finishDiff === 0
              ? 'Presne na deadline'
              : finishDiff < 0
                ? `${Math.abs(finishDiff)} dní pred deadlinom`
                : `${finishDiff} dní po deadlinu`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Simulácia – ${project.name}`} />

            <div className="space-y-4 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{project.name}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Posuňte slidre a okamžite uvidíte dopad na priebeh projektu — nič sa neukladá.
                        </p>
                    </div>
                    <Link
                        href="/capacity-management"
                        className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        ← Dashboard
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    {/* Left: controls */}
                    <ProjectSimControls
                        deadlineDaysShift={deadlineDaysShift}
                        teamSize={teamSize}
                        remainingHours={remainingHours}
                        baselineTeamSize={simulation.baseline_team_size}
                        baselineRemainingHours={simulation.baseline_remaining_hours}
                        onDeadlineChange={handleDeadlineChange}
                        onTeamSizeChange={handleTeamSizeChange}
                        onRemainingHoursChange={handleRemainingHoursChange}
                        onReset={handleReset}
                        loading={loading}
                    />

                    {/* Right: chart + stats */}
                    <div className="space-y-4">
                        {/* Burn-down chart */}
                        <div className="rounded-lg border bg-white p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-800">
                                    Burn-down diagram
                                </h2>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-gray-400" />
                                        Plán (ideál)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block h-0.5 w-5 bg-indigo-500" />
                                        Predikcia
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-red-400" />
                                        Deadline
                                    </span>
                                </div>
                            </div>
                            <BurnDownChart
                                points={simulation.burn_down_points}
                                loading={loading}
                            />
                        </div>

                        {/* Stats cards */}
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {/* Will meet deadline */}
                            <StatCard
                                label="Stihnutie deadline"
                                value={
                                    simulation.finish_diff_days === null ? (
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <XCircle className="h-4 w-4" /> N/A
                                        </span>
                                    ) : simulation.will_meet_deadline ? (
                                        <span className="flex items-center gap-1 text-emerald-600">
                                            <CheckCircle2 className="h-4 w-4" /> Áno
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-600">
                                            <XCircle className="h-4 w-4" /> Nie
                                        </span>
                                    )
                                }
                                sub={finishDiffLabel}
                                highlight={simulation.will_meet_deadline}
                            />

                            {/* Forecast finish */}
                            <StatCard
                                label="Predpokladané dokončenie"
                                value={
                                    simulation.forecast_finish_date
                                        ? formatDate(simulation.forecast_finish_date)
                                        : '—'
                                }
                                sub={`Deadline: ${formatDate(simulation.simulated_deadline)}`}
                            />

                            {/* Weekly capacity */}
                            <StatCard
                                label="Kapacita tímu / týždeň"
                                value={`${simulation.simulated_weekly_capacity} h`}
                                sub={
                                    simulation.simulated_weekly_capacity !== simulation.baseline_weekly_capacity
                                        ? `Pôvodne: ${simulation.baseline_weekly_capacity} h`
                                        : 'Nezmenená'
                                }
                            />

                            {/* Remaining hours */}
                            <StatCard
                                label="Zostávajúce hodiny"
                                value={`${simulation.simulated_remaining_hours} h`}
                                sub={
                                    simulation.simulated_remaining_hours !== simulation.baseline_remaining_hours
                                        ? `Pôvodne: ${simulation.baseline_remaining_hours} h`
                                        : 'Nezmenené'
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({
    label,
    value,
    sub,
    highlight,
}: {
    label: string;
    value: React.ReactNode;
    sub?: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={`rounded-lg border p-4 ${highlight === false ? 'border-red-200 bg-red-50' : highlight === true ? 'border-emerald-200 bg-emerald-50' : 'bg-white'}`}
        >
            <p className="text-xs text-gray-500">{label}</p>
            <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' });
}
