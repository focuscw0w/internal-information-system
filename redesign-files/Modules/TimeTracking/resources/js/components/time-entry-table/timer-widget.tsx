import { Clock, Square } from 'lucide-react';
import { useState } from 'react';
import { useTimer } from '../../context/timer-context';
import { StopTimerDialog } from './dialogs/stop-timer';

const formatElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
        h.toString().padStart(2, '0'),
        m.toString().padStart(2, '0'),
        s.toString().padStart(2, '0'),
    ].join(':');
};

export const TimerWidget = () => {
    const { timer } = useTimer();
    const [showStop, setShowStop] = useState(false);

    if (!timer.isRunning) {
        return null;
    }

    return (
        <>
            <div className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                    <Clock className="h-4 w-4 text-gray-500" />
                </div>

                <div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                        {formatElapsed(timer.elapsed)}
                    </span>
                    <span className="max-w-32 truncate text-xs text-gray-500">
                        {timer.taskName}
                    </span>
                </div>

                <button
                    onClick={() => setShowStop(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                    title="Zastaviť časovač"
                >
                    <Square className="h-4 w-4" />
                </button>
            </div>

            <StopTimerDialog open={showStop} onOpenChange={setShowStop} />
        </>
    );
};
