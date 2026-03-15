import { Button } from '@/components/ui/button';
import { SharedData } from '@/types';
import { Play, Square } from 'lucide-react';
import { Project, Task } from 'Modules/Project/resources/js/types/types';
import { usePage } from '@inertiajs/react';
import { useTimer } from '../context/timer-context';

interface TaskTimerButtonProps {
    project: Project;
    task: Task;
}

export const TaskTimerButton = ({ project, task }: TaskTimerButtonProps) => {
    const { timer, startTimer, stopTimer } = useTimer();
    const currentUserId = usePage<SharedData>().props.auth.user.id;

    const isAssigned = task.assigned_users?.some((u) => u.id === currentUserId);

    if (!isAssigned) {
        return null;
    }

    const isThisTaskRunning = timer.isRunning && timer.taskId === task.id;

    const handleClick = () => {
        if (isThisTaskRunning) {
            stopTimer();
        } else {
            startTimer(project, task);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
                e.stopPropagation();
                handleClick();
            }}
            title={isThisTaskRunning ? 'Zastaviť časovač' : 'Spustiť časovač'}
        >
            {isThisTaskRunning ? (
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <Square className="h-3.5 w-3.5 text-red-500" />
                </div>
            ) : (
                <Play className="h-3.5 w-3.5 text-gray-500" />
            )}
        </Button>
    );
};
