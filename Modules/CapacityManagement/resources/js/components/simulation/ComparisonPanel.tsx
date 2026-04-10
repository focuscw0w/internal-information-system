import { UtilizationBar } from '../shared/utilization';
import type { DashboardSnapshot, SimulationDelta } from '../../types/simulation';

function DeltaBadge({ value, unit = 'pp', invert = false }: { value: number; unit?: string; invert?: boolean }) {
    if (value === 0) return <span className="text-xs text-gray-400">±0{unit}</span>;
    const isGood = invert ? value < 0 : value > 0;
    return (
        <span className={`text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
            {value > 0 ? '+' : ''}{value}{unit}
        </span>
    );
}

function OverviewCard({
    label,
    baseline,
    simulated,
    deltaUtil,
}: {
    label: string;
    baseline: { capacity_hours: number; load_hours: number; utilization: number };
    simulated: { capacity_hours: number; load_hours: number; utilization: number };
    deltaUtil: number;
}) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">{label}</h3>
                <DeltaBadge value={deltaUtil} invert />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                    <p className="text-xs text-gray-500">Aktuálny</p>
                    <p className="text-sm">{baseline.load_hours}h / {baseline.capacity_hours}h</p>
                    <UtilizationBar utilization={baseline.utilization} />
                    <p className="mt-1 text-xs text-gray-500">{baseline.utilization}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Simulovaný</p>
                    <p className="text-sm">{simulated.load_hours}h / {simulated.capacity_hours}h</p>
                    <UtilizationBar utilization={simulated.utilization} />
                    <p className="mt-1 text-xs text-gray-500">{simulated.utilization}%</p>
                </div>
            </div>
        </div>
    );
}

function PredictionCard({
    baseline,
    simulated,
    delta,
}: {
    baseline: DashboardSnapshot['prediction'];
    simulated: DashboardSnapshot['prediction'];
    delta: SimulationDelta;
}) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <h3 className="text-sm font-medium text-gray-700">Predikcia dokončenia</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                    <p className="text-xs text-gray-500">Aktuálny</p>
                    <p className={`text-sm font-medium ${baseline.can_finish ? 'text-emerald-600' : 'text-red-600'}`}>
                        {baseline.can_finish ? 'Stihne' : 'Riziko'} ({baseline.confidence}%)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">zostatok: {baseline.remaining_project_hours}h</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Simulovaný</p>
                    <p className={`text-sm font-medium ${simulated.can_finish ? 'text-emerald-600' : 'text-red-600'}`}>
                        {simulated.can_finish ? 'Stihne' : 'Riziko'} ({simulated.confidence}%)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">zostatok: {simulated.remaining_project_hours}h</p>
                </div>
            </div>
            <div className="mt-2 flex gap-3 text-xs">
                <DeltaBadge value={delta.confidence_pp} unit="pp" />
                <DeltaBadge value={-delta.remaining_project_hours_delta} unit="h" />
            </div>
        </div>
    );
}

function UserDeltaTable({ delta }: { delta: SimulationDelta }) {
    if (delta.per_user.length === 0) return null;
    const changed = delta.per_user.filter(
        (u) => Math.abs(u.weekly_util_after - u.weekly_util_before) >= 0.5
    );
    if (changed.length === 0) return null;

    return (
        <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Zmeny per zamestnanec</h3>
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-gray-400 text-left">
                        <th className="pb-1">Meno</th>
                        <th className="pb-1 text-right">Pred</th>
                        <th className="pb-1 text-right">Po</th>
                        <th className="pb-1 text-right">Δ</th>
                    </tr>
                </thead>
                <tbody>
                    {changed.map((u) => {
                        const diff = Math.round((u.weekly_util_after - u.weekly_util_before) * 10) / 10;
                        return (
                            <tr key={u.id} className="border-t border-gray-50">
                                <td className="py-1 font-medium">{u.name}</td>
                                <td className="py-1 text-right text-gray-500">{u.weekly_util_before}%</td>
                                <td className="py-1 text-right text-gray-500">{u.weekly_util_after}%</td>
                                <td className="py-1 text-right">
                                    <span className={diff > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                        {diff > 0 ? '+' : ''}{diff}pp
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ProjectDeltaTable({ delta }: { delta: SimulationDelta }) {
    if (delta.per_project.length === 0) return null;
    const changed = delta.per_project.filter(
        (p) =>
            p.can_finish_before !== p.can_finish_after ||
            p.is_overdue_before !== p.is_overdue_after ||
            Math.abs(p.days_remaining_after - p.days_remaining_before) >= 1
    );
    if (changed.length === 0) return null;

    return (
        <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Zmeny per projekt</h3>
            <div className="space-y-2">
                {changed.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-xs rounded border px-3 py-2">
                        <span className="font-medium">{p.name}</span>
                        <div className="flex gap-3 text-gray-500">
                            {p.can_finish_before !== p.can_finish_after && (
                                <span>
                                    {p.can_finish_before ? '✓ Stihne' : '✗ Riziko'} →{' '}
                                    <span className={p.can_finish_after ? 'text-emerald-600' : 'text-red-600'}>
                                        {p.can_finish_after ? '✓ Stihne' : '✗ Riziko'}
                                    </span>
                                </span>
                            )}
                            {p.days_remaining_before !== p.days_remaining_after && (
                                <span>
                                    {p.days_remaining_before}d → {p.days_remaining_after}d
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ComparisonPanel({
    baseline,
    simulated,
    delta,
}: {
    baseline: DashboardSnapshot;
    simulated: DashboardSnapshot;
    delta: SimulationDelta;
}) {
    return (
        <div className="space-y-4">
            <OverviewCard
                label="Týždenné zaťaženie"
                baseline={baseline.weekly_overview}
                simulated={simulated.weekly_overview}
                deltaUtil={delta.weekly_utilization_pp}
            />
            <OverviewCard
                label="Mesačné zaťaženie"
                baseline={baseline.monthly_overview}
                simulated={simulated.monthly_overview}
                deltaUtil={delta.monthly_utilization_pp}
            />
            <PredictionCard baseline={baseline.prediction} simulated={simulated.prediction} delta={delta} />
            <UserDeltaTable delta={delta} />
            <ProjectDeltaTable delta={delta} />
        </div>
    );
}
