import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRightLeft,
    ArrowUpDown,
    Calendar,
    CheckCircle,
    CirclePlus,
    Filter,
    Pencil,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Activity, Project } from '../../../types/types';

type ActivityTypeFilter =
    | 'task_created'
    | 'task_updated'
    | 'task_deleted'
    | 'task_assigned'
    | 'task_status_changed'
    | 'task_completed';

const ACTIVITY_TYPE_OPTIONS: { value: ActivityTypeFilter; label: string }[] = [
    { value: 'task_created', label: 'Vytvorenie' },
    { value: 'task_updated', label: 'Úprava' },
    { value: 'task_deleted', label: 'Zmazanie' },
    { value: 'task_assigned', label: 'Priradenie' },
    { value: 'task_status_changed', label: 'Zmena stavu' },
    { value: 'task_completed', label: 'Dokončenie' },
];

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
    const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter | null>(
        null,
    );
    const [newestFirst, setNewestFirst] = useState(true);

    const allActivities: Activity[] = project.activities ?? [];

    const filtered = allActivities
        .filter((a) => !typeFilter || a.type === typeFilter)
        .slice()
        .sort((a, b) => {
            const diff =
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime();
            return newestFirst ? diff : -diff;
        });

    const hasFilter = Boolean(typeFilter);

    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center text-lg">
                        <Calendar className="mr-2 h-5 w-5" />
                        Časová os projektu
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />

                        <select
                            value={typeFilter ?? ''}
                            onChange={(e) =>
                                setTypeFilter(
                                    (e.target.value as ActivityTypeFilter) ||
                                        null,
                                )
                            }
                            className="rounded-md border border-gray-200 bg-card px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Všetky typy</option>
                            {ACTIVITY_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => setNewestFirst((v) => !v)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-card px-2.5 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50"
                            title={
                                newestFirst
                                    ? 'Najnovšie navrchu'
                                    : 'Najstaršie navrchu'
                            }
                        >
                            <ArrowUpDown className="h-3 w-3" />
                            {newestFirst ? 'Najnovšie' : 'Najstaršie'}
                        </button>

                        {hasFilter && (
                            <button
                                onClick={() => setTypeFilter(null)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-3 w-3" />
                                Zrušiť filter
                            </button>
                        )}

                        {hasFilter && (
                            <span className="text-xs text-gray-400">
                                {filtered.length} z {allActivities.length}
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {/* Začiatok projektu */}
                    <div className="flex items-start gap-4 border-l-2 border-blue-500 py-3 pl-4">
                        <Calendar className="h-4 w-4 text-blue-500" />
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
                    {filtered.map((activity) => (
                        <div
                            key={activity.id}
                            className={`flex items-start gap-4 border-l-2 ${getBorderColor(activity.type)} py-3 pl-4`}
                        >
                            <div className="pt-0.5">
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

                                {activity.type === 'task_status_changed' &&
                                    Boolean(activity.metadata?.old_status) && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            {String(
                                                activity.metadata?.old_status,
                                            )}{' '}
                                            →{' '}
                                            {String(
                                                activity.metadata?.new_status,
                                            )}
                                        </p>
                                    )}
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="flex items-start gap-4 border-l-2 border-gray-200 py-3 pl-4">
                            <p className="text-sm text-gray-400">
                                {hasFilter
                                    ? 'Žiadne aktivity nezodpovedajú filtru.'
                                    : 'Zatiaľ žiadna aktivita.'}
                            </p>
                        </div>
                    )}

                    {/* Deadline */}
                    <div className="flex items-start gap-4 border-l-2 border-green-500 py-3 pl-4">
                        <Calendar className="h-4 w-4 text-green-500" />
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
