import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRightLeft,
    Calendar,
    CheckCircle,
    CirclePlus,
    Pencil,
    Trash2,
    Users,
} from 'lucide-react';
import { Activity, Project } from '../../../types/types';

interface TimelineProps {
    project: Project;
}

const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
        task_created: <CirclePlus className="h-4 w-4 text-emerald-500" />,
        task_updated: <Pencil className="h-4 w-4 text-blue-500" />,
        task_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
        task_assigned: <Users className="h-4 w-4 text-purple-500" />,
        task_status_changed: (
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
        ),
        task_completed: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    };

    return icons[type] ?? <Calendar className="h-4 w-4 text-gray-400" />;
};

const getBorderColor = (type: string) => {
    const colors: Record<string, string> = {
        task_created: 'border-emerald-400',
        task_updated: 'border-blue-400',
        task_deleted: 'border-red-400',
        task_assigned: 'border-purple-400',
        task_status_changed: 'border-amber-400',
        task_completed: 'border-emerald-400',
    };

    return colors[type] ?? 'border-gray-300';
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export function Timeline({ project }: TimelineProps) {
    const activities: Activity[] = project.activities ?? [];

    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5" />
                    Časová os projektu
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {/* Začiatok projektu */}
                    <div className="flex items-start gap-4 border-l-2 border-blue-500 py-3 pl-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">
                                Začiatok projektu
                            </p>
                            <p className="text-sm text-gray-500">
                                {new Date(
                                    project.start_date,
                                ).toLocaleDateString('sk-SK')}
                            </p>
                        </div>
                    </div>

                    {/* Activity log */}
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className={`flex items-start gap-4 border-l-2 ${getBorderColor(activity.type)} py-3 pl-4`}
                        >
                            <div className="flex items-center gap-2 pt-0.5">
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-900">
                                    {activity.description}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                    <span>{activity.user.name}</span>
                                    <span>•</span>
                                    <span>
                                        {formatDate(activity.created_at)}
                                    </span>
                                </div>

                                {/* Metadata – zmena stavu */}
                                {activity.type === 'task_status_changed' &&
                                    activity.metadata?.old_status && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            {activity.metadata.old_status} →{' '}
                                            {activity.metadata.new_status}
                                        </p>
                                    )}
                            </div>
                        </div>
                    ))}

                    {activities.length === 0 && (
                        <div className="flex items-start gap-4 border-l-2 border-gray-200 py-3 pl-4">
                            <p className="text-sm text-gray-400">
                                Zatiaľ žiadna aktivita.
                            </p>
                        </div>
                    )}

                    {/* Deadline */}
                    <div className="flex items-start gap-4 border-l-2 border-green-500 py-3 pl-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">
                                Deadline projektu
                            </p>
                            <p className="text-sm text-gray-500">
                                {new Date(project.end_date).toLocaleDateString(
                                    'sk-SK',
                                )}
                                {project.days_remaining > 0
                                    ? ` • Zostáva ${project.days_remaining} dní`
                                    : ' • Projekt skončil'}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
