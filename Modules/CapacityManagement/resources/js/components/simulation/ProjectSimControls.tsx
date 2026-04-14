import { Slider } from '@/components/ui/slider';

type Props = {
    deadlineDaysShift: number;
    teamSize: number;
    remainingHours: number;
    baselineTeamSize: number;
    baselineRemainingHours: number;
    onDeadlineChange: (days: number) => void;
    onTeamSizeChange: (size: number) => void;
    onRemainingHoursChange: (hours: number) => void;
    onReset: () => void;
    loading: boolean;
};

function SliderRow({
    label,
    value,
    displayValue,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    value: number;
    displayValue: string;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="min-w-[80px] text-right font-mono text-indigo-600">{displayValue}</span>
            </div>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
            />
            <div className="flex justify-between text-xs text-gray-400">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
}

export function ProjectSimControls({
    deadlineDaysShift,
    teamSize,
    remainingHours,
    baselineTeamSize,
    baselineRemainingHours,
    onDeadlineChange,
    onTeamSizeChange,
    onRemainingHoursChange,
    onReset,
    loading,
}: Props) {
    const isChanged = deadlineDaysShift !== 0 || teamSize !== baselineTeamSize || remainingHours !== baselineRemainingHours;

    const deadlineDisplay =
        deadlineDaysShift === 0
            ? 'Pôvodný'
            : deadlineDaysShift > 0
              ? `+${deadlineDaysShift} dní`
              : `${deadlineDaysShift} dní`;

    return (
        <div className="space-y-6 rounded-lg border bg-white p-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Parametre simulácie</h3>
                {isChanged && (
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={loading}
                        className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Resetovať
                    </button>
                )}
            </div>

            <SliderRow
                label="Posun deadline"
                value={deadlineDaysShift}
                displayValue={deadlineDisplay}
                min={-30}
                max={90}
                step={1}
                onChange={onDeadlineChange}
            />

            <SliderRow
                label="Počet ľudí na projekte"
                value={teamSize}
                displayValue={`${teamSize} osôb`}
                min={0}
                max={Math.max(baselineTeamSize * 3, 10)}
                step={1}
                onChange={onTeamSizeChange}
            />

            <SliderRow
                label="Zostávajúce hodiny"
                value={Math.round(remainingHours)}
                displayValue={`${Math.round(remainingHours)} h`}
                min={0}
                max={Math.max(Math.round(baselineRemainingHours * 2), 100)}
                step={5}
                onChange={onRemainingHoursChange}
            />

            {loading && (
                <p className="text-center text-xs text-indigo-500">Prepočítavam…</p>
            )}
        </div>
    );
}
