import { FormDialog } from '@/components/dialogs/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { useTimer } from '../../../context/timer-context';

interface StopTimerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Format seconds to human readable string.
 */
const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
};

/**
 * Convert seconds to decimal hours (rounded to 0.25).
 */
const secondsToHours = (seconds: number): string => {
    const raw = seconds / 3600;
    const rounded = Math.max(0.25, Math.round(raw * 4) / 4);
    return rounded.toFixed(2);
};

export const StopTimerDialog = ({
    open,
    onOpenChange,
}: StopTimerDialogProps) => {
    const { timer, stopTimer, resetTimer } = useTimer();

    const hours = secondsToHours(timer.elapsed);

    const { data, setData, post, processing } = useForm({
        task_id: String(timer.taskId ?? ''),
        entry_date: new Date().toISOString().split('T')[0],
        hours: hours,
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const projectId = timer.projectId;
        if (!projectId) return;

        post(`/projects/${projectId}/time-entries`, {
            preserveScroll: true,
            onSuccess: () => {
                stopTimer();
                onOpenChange(false);
            },
        });
    };

    const handleDiscard = () => {
        resetTimer();
        onOpenChange(false);
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Zastaviť časovač"
            description="Skontrolujte a uložte zaznamenaný čas."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť záznam"
        >
            <div className="space-y-4">
                {/* Summary */}
                <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                {timer.projectName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {timer.taskName}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                                {formatDuration(timer.elapsed)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hours (editable) */}
                <div>
                    <Label htmlFor="stop_hours">Hodiny</Label>
                    <Input
                        id="stop_hours"
                        type="number"
                        min="0.25"
                        max="24"
                        step="0.25"
                        value={data.hours}
                        onChange={(e) => setData('hours', e.target.value)}
                        className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Automaticky zaokrúhlené na 0.25h. Môžete upraviť.
                    </p>
                </div>

                {/* Date */}
                <div>
                    <Label htmlFor="stop_date">Dátum</Label>
                    <Input
                        id="stop_date"
                        type="date"
                        value={data.entry_date}
                        onChange={(e) => setData('entry_date', e.target.value)}
                        className="mt-1"
                    />
                </div>

                {/* Description */}
                <div>
                    <Label htmlFor="stop_description">Popis</Label>
                    <textarea
                        id="stop_description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Čo ste robili..."
                        rows={3}
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                {/* Discard */}
                <button
                    type="button"
                    onClick={handleDiscard}
                    className="w-full text-center text-sm text-red-500 hover:text-red-600 hover:underline"
                >
                    Zahodiť záznam
                </button>
            </div>
        </FormDialog>
    );
};
