import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

interface TimerState {
    isRunning: boolean;
    startedAt: number | null;
    projectId: number | null;
    projectName: string | null;
    taskId: number | null;
    taskName: string | null;
    elapsed: number; // seconds
}

interface TimerContextType {
    timer: TimerState;
    startTimer: (
        project: { id: number; name: string },
        task: { id: number; title: string },
    ) => void;
    stopTimer: () => TimerState;
    resetTimer: () => void;
}

const STORAGE_KEY = 'time-tracker-timer';

const defaultState: TimerState = {
    isRunning: false,
    startedAt: null,
    projectId: null,
    projectName: null,
    taskId: null,
    taskName: null,
    elapsed: 0,
};

const TimerContext = createContext<TimerContextType | null>(null);

/**
 * Load timer state from localStorage (survives page refresh).
 */
const loadState = (): TimerState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return defaultState;

        const parsed = JSON.parse(saved) as TimerState;

        // Recalculate elapsed if timer was running
        if (parsed.isRunning && parsed.startedAt) {
            parsed.elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
        }

        return parsed;
    } catch {
        return defaultState;
    }
};

/**
 * Save timer state to localStorage.
 */
const saveState = (state: TimerState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
};

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const [timer, setTimer] = useState<TimerState>(loadState);

    // Tick every second when running
    useEffect(() => {
        if (!timer.isRunning || !timer.startedAt) return;

        const interval = setInterval(() => {
            setTimer((prev) => ({
                ...prev,
                elapsed: Math.floor(
                    (Date.now() - (prev.startedAt ?? Date.now())) / 1000,
                ),
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, [timer.isRunning, timer.startedAt]);

    // Persist to localStorage on every change
    useEffect(() => {
        saveState(timer);
    }, [timer]);

    const startTimer = useCallback(
        (
            project: { id: number; name: string },
            task: { id: number; title: string },
        ) => {
            setTimer({
                isRunning: true,
                startedAt: Date.now(),
                projectId: project.id,
                projectName: project.name,
                taskId: task.id,
                taskName: task.title,
                elapsed: 0,
            });
        },
        [],
    );

    const stopTimer = useCallback(() => {
        const current = { ...timer };
        setTimer(defaultState);
        saveState(defaultState);
        return current;
    }, [timer]);

    const resetTimer = useCallback(() => {
        setTimer(defaultState);
        saveState(defaultState);
    }, []);

    return (
        <TimerContext.Provider
            value={{ timer, startTimer, stopTimer, resetTimer }}
        >
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = (): TimerContextType => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within TimerProvider');
    }
    return context;
};
