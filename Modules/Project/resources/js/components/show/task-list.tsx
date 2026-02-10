import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
//import { router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    CircleDashed,
    PlayCircle,
} from 'lucide-react';
import { Project } from '../../types/project.types';
import { TaskActions } from './task-actions';
import { CreateTaskDialog } from './dialogs/create-task';

interface TaskListProps {
    project: Project;
}

export const TaskList = ({ project }: TaskListProps) => {
    console.log(project)

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            medium: 'bg-amber-50 text-amber-700 border-amber-200',
            high: 'bg-red-50 text-red-700 border-red-200',
        };
        return colors[priority as keyof typeof colors];
    };

    const getTaskStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'in_progress':
                return <PlayCircle className="h-5 w-5 text-blue-500" />;
            case 'testing':
                return <AlertCircle className="h-5 w-5 text-amber-500" />;
            default:
                return <CircleDashed className="h-5 w-5 text-gray-400" />;
        }
    };

    return (
        <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Úlohy ({project.tasks_completed}/{project.tasks_total})
                    </CardTitle>
                    <CreateTaskDialog projectId={project.id} team={project.team} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {project.tasks &&
                        project.tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 bg-gray-50/30 p-4 transition-all hover:border-gray-200 hover:shadow-sm"
                            >
                                <div className="flex flex-1 items-center gap-3">
                                    {getTaskStatusIcon(task.status)}
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">
                                            {task.title}
                                        </h4>
                                        <div className="mt-1 flex items-center gap-3">
                                            {task.assigned_user && (
                                                <span className="text-sm text-gray-500">
                                                    👤 {task.assigned_user.name}
                                                </span>
                                            )}
                                            {task.due_date && (
                                                <span className="text-sm text-gray-500">
                                                    📅{' '}
                                                    {new Date(
                                                        task.due_date,
                                                    ).toLocaleDateString(
                                                        'sk-SK',
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge
                                        variant="outline"
                                        className={getPriorityColor(
                                            task.priority,
                                        )}
                                    >
                                        {task.priority}
                                    </Badge>
                                    <div className="text-right text-sm">
                                        <div className="font-semibold text-gray-900">
                                            {task.actual_hours}h /{' '}
                                            {task.estimated_hours}h
                                        </div>
                                        {task.actual_hours >
                                            task.estimated_hours && (
                                            <span className="text-xs text-red-600">
                                                +
                                                {task.actual_hours -
                                                    task.estimated_hours}
                                                h
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <TaskActions
                                        task={task}
                                        projectId={project.id}
                                        team={project.team}
                                    />
                                </div>
                            </div>
                        ))}

                    {(!project.tasks || project.tasks.length === 0) && (
                        <div className="py-12 text-center">
                            <CircleDashed className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p className="mb-4 text-gray-500">
                                Zatiaľ nie sú vytvorené žiadne úlohy
                            </p>
                            <CreateTaskDialog projectId={project.id} team={project.team} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
