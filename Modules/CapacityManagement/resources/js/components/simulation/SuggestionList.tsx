import type { SimulationInputPayload, SimulationSuggestion } from '../../types/simulation';

const severityStyle: Record<string, string> = {
    critical: 'border-red-200 bg-red-50',
    warning: 'border-orange-200 bg-orange-50',
    info: 'border-blue-200 bg-blue-50',
};

const severityBadge: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-orange-100 text-orange-700',
    info: 'bg-blue-100 text-blue-700',
};

const severityLabel: Record<string, string> = {
    critical: 'Kritické',
    warning: 'Upozornenie',
    info: 'Info',
};

export function SuggestionList({
    suggestions,
    onApply,
}: {
    suggestions: SimulationSuggestion[];
    onApply: (change: Partial<SimulationInputPayload>) => void;
}) {
    if (suggestions.length === 0) {
        return (
            <p className="text-sm text-gray-400 italic">Žiadne návrhy — simulovaný stav je v poriadku.</p>
        );
    }

    return (
        <div className="space-y-2">
            {suggestions.map((s) => (
                <div
                    key={s.id}
                    className={`rounded-md border p-3 ${severityStyle[s.severity] ?? 'border-gray-200 bg-gray-50'}`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${severityBadge[s.severity] ?? 'bg-gray-100 text-gray-700'}`}
                                >
                                    {severityLabel[s.severity] ?? s.severity}
                                </span>
                                <p className="text-sm font-medium">{s.title}</p>
                            </div>
                            <p className="mt-1 text-xs text-gray-600">{s.rationale}</p>
                        </div>

                        {Object.keys(s.proposed_change).filter((k) => !k.startsWith('_')).some(
                            (k) => {
                                const v = (s.proposed_change as Record<string, unknown>)[k];
                                return Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' && Object.keys(v).length > 0;
                            }
                        ) && (
                            <button
                                type="button"
                                onClick={() => onApply(s.proposed_change)}
                                className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Aplikovať návrh
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
