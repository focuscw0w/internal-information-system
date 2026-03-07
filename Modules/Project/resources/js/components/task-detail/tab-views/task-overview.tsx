import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Target, User } from 'lucide-react';
import { TaskTimeSummary } from '../../../../../../TimeTracking/resources/js/components/task-time-summary';
import { Project, Task } from '../../../types/types';

interface TaskOverviewProps {
    task: Task;
    project: Project;
}

export const TaskOverview = ({ task, project }: TaskOverviewProps) => {
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
                <TaskTimeSummary task={task} project={project} />
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

                        {task.assigned_users &&
                            task.assigned_users.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Priradení
                                        </p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {task.assigned_users
                                                .map((u) => u.name)
                                                .join(', ')}
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
                                <span className="text-gray-500">Vytvorené</span>
                                <span className="text-gray-900">
                                    {new Date(
                                        task.created_at,
                                    ).toLocaleDateString('sk-SK')}
                                </span>
                            </div>
                        )}
                        {task && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Upravené</span>
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
