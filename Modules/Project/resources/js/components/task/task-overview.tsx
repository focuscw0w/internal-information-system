import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Target, User } from 'lucide-react';
import { Project, Task } from '../../types/types';

interface TaskOverviewProps {
    task: Task;
    project: Project;
}

export const TaskOverview = ({ task, project }: TaskOverviewProps) => {
    const isOverEstimate =
        task.estimated_hours && task.actual_hours > task.estimated_hours;

    const estimateProgress =
        task.estimated_hours && task.estimated_hours > 0
            ? Math.min((task.actual_hours / task.estimated_hours) * 100, 100)
            : 0;

    console.log(task)

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left - Main content */}
            <div className="space-y-6 lg:col-span-2">
                {/* Description */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Popis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {task.description ? (
                            <p className="leading-relaxed text-gray-600">
                                {task.description}
                            </p>
                        ) : (
                            <p className="text-gray-400 italic">
                                Žiadny popis nebol pridaný.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Time tracking summary */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Sledovanie času
                        </CardTitle>
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
                                <p className="text-sm text-gray-500">
                                    Skutočnosť
                                </p>
                                <p
                                    className={`mt-1 text-2xl font-bold ${
                                        isOverEstimate
                                            ? 'text-red-600'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {task.actual_hours ?? 0}
                                    <span className="ml-1 text-sm font-normal text-gray-500">
                                        hod
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Progress bar */}
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
                                        className={`h-full rounded-full transition-all ${
                                            isOverEstimate
                                                ? 'bg-red-500'
                                                : 'bg-blue-600'
                                        }`}
                                        style={{
                                            width: `${Math.min(estimateProgress, 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right - Sidebar */}
            <div className="space-y-6">
                {/* Details */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm tracking-wide text-gray-500 uppercase">
                            Detaily
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Projekt</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {project.name}
                                </p>
                            </div>
                        </div>

                        {task.assigned_user && (
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Priradený
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {task.assigned_user.name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {task.due_date && (
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Deadline
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(
                                            task.due_date,
                                        ).toLocaleDateString('sk-SK')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {task.estimated_hours && (
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Odhadovaný čas
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {task.estimated_hours} hod
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dates */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm tracking-wide text-gray-500 uppercase">
                            Dátumy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {task.created_at && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Vytvorená</span>
                                <span className="text-gray-900">
                                    {new Date(
                                        task.created_at,
                                    ).toLocaleDateString('sk-SK')}
                                </span>
                            </div>
                        )}
                        {task && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Upravená</span>
                                <span className="text-gray-900">
                                    {new Date(
                                        task.updated_at,
                                    ).toLocaleDateString('sk-SK')}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
