import type { SimulationDelta } from '../../types/simulation';

export function AlertDiffList({ delta }: { delta: SimulationDelta }) {
    const hasChanges =
        delta.users_over_capacity_added.length > 0 ||
        delta.users_over_capacity_resolved.length > 0 ||
        delta.projects_at_risk_added.length > 0 ||
        delta.projects_at_risk_resolved.length > 0;

    if (!hasChanges) return null;

    return (
        <div className="space-y-2">
            {delta.users_over_capacity_added.map((u) => (
                <div key={u.id} className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <span className="font-medium">⚠ Nové preťaženie:</span>
                    <span>{u.name} ({u.before}% → {u.after}%)</span>
                </div>
            ))}

            {delta.projects_at_risk_added.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                    <span className="font-medium">⚠ Nové riziko:</span>
                    <span>Projekt „{p.name}" chýba {p.hours_short}h kapacity</span>
                </div>
            ))}

            {delta.users_over_capacity_resolved.map((u) => (
                <div key={u.id} className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <span className="font-medium">✓ Vyriešené:</span>
                    <span>{u.name} ({u.before}% → {u.after}%)</span>
                </div>
            ))}

            {delta.projects_at_risk_resolved.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <span className="font-medium">✓ Projekt v poriadku:</span>
                    <span>„{p.name}"</span>
                </div>
            ))}
        </div>
    );
}
