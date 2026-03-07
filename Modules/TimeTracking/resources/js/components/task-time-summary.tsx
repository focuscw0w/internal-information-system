import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project, Task } from 'Modules/Project/resources/js/types/types';

interface TaskTimeSummaryProps {
    task: Task;
    project: Project;
}

export const TaskTimeSummary = ({ task }: TaskTimeSummaryProps) => {
    const isOverEstimate =
        task.estimated_hours && task.actual_hours > task.estimated_hours;

    const estimateProgress =
        task.estimated_hours && task.estimated_hours > 0
            ? Math.min((task.actual_hours / task.estimated_hours) * 100, 100)
            : 0;

    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Sledovanie času</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Odhad</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {task.estimated_hours ?? '—'}
                            <span className="ml-1 text-sm font-normal text-gray-500">
                                hod
                            </span>
                        </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">Skutočnosť</p>
                        <p
                            className={`mt-1 text-2xl font-bold ${isOverEstimate ? 'text-red-600' : 'text-gray-900'}`}
                        >
                            {task.actual_hours ?? 0}
                            <span className="ml-1 text-sm font-normal text-gray-500">
                                hod
                            </span>
                        </p>
                    </div>
                </div>

                {task.estimated_hours && task.estimated_hours > 0 && (
                    <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs text-gray-500">
                            <span>Priebeh</span>
                            <span>
                                {task.actual_hours ?? 0} /{' '}
                                {task.estimated_hours} hod
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                                className={`h-full rounded-full transition-all ${isOverEstimate ? 'bg-red-500' : 'bg-blue-600'}`}
                                style={{
                                    width: `${Math.min(estimateProgress, 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
