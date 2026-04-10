export function utilizationColor(utilization: number): string {
    if (utilization >= 100) return '#ef4444';
    if (utilization >= 80) return '#f97316';
    return '#10b981';
}

export function UtilizationBar({ utilization }: { utilization: number }) {
    const color = utilizationColor(utilization);
    const width = Math.min(100, utilization);
    return (
        <div className="mt-2 h-2 w-full rounded bg-gray-100">
            <div
                className="h-2 rounded transition-all"
                style={{ width: `${width}%`, backgroundColor: color }}
            />
        </div>
    );
}

export function StatusBadge({ utilization }: { utilization: number }) {
    const color =
        utilization > 100
            ? 'bg-red-100 text-red-700'
            : utilization >= 80
              ? 'bg-orange-100 text-orange-700'
              : 'bg-emerald-100 text-emerald-700';

    return (
        <span className={`rounded px-2 py-1 text-xs font-medium ${color}`}>
            {utilization}%
        </span>
    );
}
