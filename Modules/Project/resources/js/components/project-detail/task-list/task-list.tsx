import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    CircleDashed,
    PlayCircle,
} from 'lucide-react';
import { Project } from '../../../types/types';
import { CreateTaskDialog } from './dialogs/create-task';
import { TaskActions } from './task-actions';
import { BadgeLabel } from '../../ui/badge';

interface TaskTableProps {
    project: Project;
}

export const TaskTable = ({ project }: TaskTableProps) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'in_progress':
                return <PlayCircle className="h-4 w-4 text-blue-500" />;
            case 'testing':
                return <AlertCircle className="h-4 w-4 text-amber-500" />;
            default:
                return <CircleDashed className="h-4 w-4 text-gray-400" />;
        }
    };

    const tasks = project.tasks ?? [];

    return (
        <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Úlohy
                        {tasks.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({project.tasks_completed}/{project.tasks_total})
                            </span>
                        )}
                    </CardTitle>
                    <CreateTaskDialog
                        projectId={project.id}
                        team={project.team}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="py-12 text-center">
                        <CircleDashed className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <p className="mb-4 text-gray-500">
                            Zatiaľ nie sú vytvorené žiadne úlohy
                        </p>
                        <CreateTaskDialog
                            projectId={project.id}
                            team={project.team}
                        />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                            <th className="pb-3 font-medium">Názov</th>
                            <th className="w-32 pb-3 text-left font-medium">Stav</th>
                            <th className="w-28 pb-3 text-left font-medium">Priorita</th>
                            <th className="w-32 pb-3 text-left font-medium">Deadline</th>
                            <th className="w-28 pb-3 text-center font-medium">Hodiny</th>
                            <th className="w-16 pb-3 text-center font-medium">Akcie</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                onClick={() =>
                                    router.visit(
                                        `/projects/${project.id}/tasks/${task.id}`,
                                    )
                                }
                                className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50/50"
                            >
                                {/* Názov */}
                                <td className="py-3 pr-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(task.status)}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {task.title}
                                            </p>
                                            {task.assigned_users && task.assigned_users.length > 0 && (
                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    👤 {task.assigned_users.map((u) => u.name).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Stav */}
                                <td className="py-3 pr-4">
                                       <BadgeLabel type="status" value={task.status} className="py-3" />
                                </td>

                                {/* Priorita */}
                                <td className="py-3 pr-4">
                                    <BadgeLabel type="priority" value={task.priority} className="py-3" />
                                </td>

                                {/* Deadline */}
                                <td className="py-3 pr-4">
                                    {task.due_date ? (
                                        <span className="text-sm text-gray-600">
                                                {new Date(task.due_date).toLocaleDateString('sk-SK')}
                                            </span>
                                    ) : (
                                        <span className="text-sm text-gray-300">—</span>
                                    )}
                                </td>

                                {/* Hodiny */}
                                <td className="py-3 pr-4 text-center">
                                        <span className={`text-sm font-medium ${
                                            task.actual_hours > task.estimated_hours
                                                ? 'text-red-600'
                                                : 'text-gray-900'
                                        }`}>
                                            {task.actual_hours ?? 0}h
                                        </span>
                                    <span className="text-sm text-gray-400">
                                            {' '}/ {task.estimated_hours}h
                                        </span>
                                    {task.actual_hours > task.estimated_hours && (
                                        <p className="text-xs text-red-500">
                                            +{task.actual_hours - task.estimated_hours}h
                                        </p>
                                    )}
                                </td>

                                {/* Akcie */}
                                <td className="py-3 text-center">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <TaskActions
                                            task={task}
                                            projectId={project.id}
                                            team={project.team}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
};
