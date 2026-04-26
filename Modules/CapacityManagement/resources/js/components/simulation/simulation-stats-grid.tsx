import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SimulationData } from '../../types/capacity';

type SimulationStatsGridProps = {
    simulation: SimulationData;
};

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);

    return date.toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function StatCard({
    label,
    value,
    sub,
    highlight,
}: {
    label: string;
    value: ReactNode;
    sub?: string;
    highlight?: boolean;
}) {
    return (
        <Card
            className={
                highlight === false
                    ? 'border-red-200 bg-red-50'
                    : highlight === true
                      ? 'border-emerald-200 bg-emerald-50'
                      : undefined
            }
        >
            <CardContent className="space-y-1 pt-6">
                <p className="text-xs text-gray-500">{label}</p>
                <div className="text-lg font-semibold text-gray-900">
                    {value}
                </div>
                {sub && <p className="text-xs text-gray-400">{sub}</p>}
            </CardContent>
        </Card>
    );
}

export function SimulationStatsGrid({ simulation }: SimulationStatsGridProps) {
    const finishDiff = simulation.finish_diff_days;
    const finishDiffLabel =
        finishDiff === null
            ? 'Nedokončiteľné (kapacita = 0)'
            : finishDiff === 0
              ? 'Presne na deadline'
              : finishDiff < 0
                ? `${Math.abs(finishDiff)} dní po deadlinu`
                : `${finishDiff} dní pred deadlinom`;

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                label="Simulované stihnutie deadline"
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
                sub={`${finishDiffLabel} pri aktuálnych parametroch`}
                highlight={simulation.will_meet_deadline}
            />

            <StatCard
                label="Simulované dokončenie"
                value={
                    simulation.forecast_finish_date
                        ? formatDate(simulation.forecast_finish_date)
                        : '—'
                }
                sub={`Simulovaný deadline: ${formatDate(simulation.simulated_deadline)}`}
            />

            <StatCard
                label="Simulovaná kapacita / týždeň"
                value={`${simulation.simulated_weekly_capacity} h`}
                sub={
                    simulation.simulated_weekly_capacity !==
                    simulation.baseline_weekly_capacity
                        ? `Pôvodne: ${simulation.baseline_weekly_capacity} h`
                        : 'Nezmenená oproti projektu'
                }
            />

            <StatCard
                label="Zostávajúce hodiny projektu"
                value={`${simulation.simulated_remaining_hours} h`}
                sub={
                    simulation.simulated_remaining_hours !==
                    simulation.baseline_remaining_hours
                        ? `Pôvodne: ${simulation.baseline_remaining_hours} h`
                        : 'Nezmenené oproti úlohám'
                }
            />
        </div>
    );
}
