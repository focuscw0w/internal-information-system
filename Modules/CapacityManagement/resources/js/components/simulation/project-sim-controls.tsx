import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    description,
    value,
    displayValue,
    baselineValue,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    description: string;
    value: number;
    displayValue: string;
    baselineValue: string;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <div className="pr-4">
                    <p className="font-medium text-gray-700">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        {description}
                    </p>
                </div>
                <span className="min-w-[80px] text-right font-mono text-primary">
                    {displayValue}
                </span>
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
            <p className="text-xs text-gray-500">Pôvodne: {baselineValue}</p>
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
    const isChanged =
        deadlineDaysShift !== 0 ||
        teamSize !== baselineTeamSize ||
        remainingHours !== baselineRemainingHours;

    const deadlineDisplay =
        deadlineDaysShift === 0
            ? 'Pôvodný'
            : deadlineDaysShift > 0
              ? `+${deadlineDaysShift} dní`
              : `${deadlineDaysShift} dní`;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-gray-800">
                    Parametre simulácie
                </CardTitle>
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
            </CardHeader>

            <CardContent className="space-y-6">
                <SliderRow
                    label="Posun deadline"
                    description="Posúva termín dokončenia iba v tejto simulácii. Projektové dáta sa neukladajú."
                    value={deadlineDaysShift}
                    displayValue={deadlineDisplay}
                    baselineValue="pôvodný deadline projektu"
                    min={-30}
                    max={90}
                    step={1}
                    onChange={onDeadlineChange}
                />

                <SliderRow
                    label="Počet ľudí na projekte"
                    description="Simuluje veľkosť tímu a podľa nej prepočíta týždennú kapacitu dostupnú pre projekt."
                    value={teamSize}
                    displayValue={`${teamSize} osôb`}
                    baselineValue={`${baselineTeamSize} osôb`}
                    min={0}
                    max={Math.max(baselineTeamSize * 3, 10)}
                    step={1}
                    onChange={onTeamSizeChange}
                />

                <SliderRow
                    label="Zostávajúce hodiny projektu"
                    description="Celková zostávajúca práca na projekte: odhadované hodiny nedokončených úloh mínus už odpracované hodiny."
                    value={Math.round(remainingHours)}
                    displayValue={`${Math.round(remainingHours)} h`}
                    baselineValue={`${Math.round(baselineRemainingHours)} h`}
                    min={0}
                    max={Math.max(Math.round(baselineRemainingHours * 2), 100)}
                    step={5}
                    onChange={onRemainingHoursChange}
                />

                {loading && (
                    <p className="text-center text-xs text-primary">
                        Prepočítavam…
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
