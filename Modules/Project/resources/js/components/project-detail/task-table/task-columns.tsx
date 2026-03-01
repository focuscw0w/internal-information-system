import {
    AlertCircle,
    CheckCircle,
    CircleDashed,
    PlayCircle,
} from 'lucide-react';
import { Task } from '../../../types/types';
import { BadgeLabel } from '../../ui/badge';
import { Column } from '@/components/ui/data-table';

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

export const TaskColumns: Column<Task>[] = [
    {
        key: 'title',
        label: 'Názov',
        render: (task) => (
            <div className="flex items-center gap-2 pr-4">
                {getStatusIcon(task.status)}
                <div>
                    <p className="text-sm font-medium text-gray-900">
                        {task.title}
                    </p>
                    {task.assigned_users && task.assigned_users.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-400">
                            👤{' '}
                            {task.assigned_users.map((u) => u.name).join(', ')}
                        </p>
                    )}
                </div>
            </div>
        ),
    },
    {
        key: 'status',
        label: 'Stav',
        width: 'w-32',
        render: (task) => (
            <BadgeLabel type="status" value={task.status} className="py-3" />
        ),
    },
    {
        key: 'priority',
        label: 'Priorita',
        width: 'w-28',
        render: (task) => (
            <BadgeLabel
                type="priority"
                value={task.priority}
                className="py-3"
            />
        ),
    },
    {
        key: 'due_date',
        label: 'Deadline',
        width: 'w-32',
        render: (task) =>
            task.due_date ? (
                <span className="text-sm text-gray-600">
                    {new Date(task.due_date).toLocaleDateString('sk-SK')}
                </span>
            ) : (
                <span className="text-sm text-gray-300">—</span>
            ),
    },
    {
        key: 'hours',
        label: 'Hodiny',
        width: 'w-28',
        align: 'center',
        render: (task) => (
            <div>
                <span
                    className={`text-sm font-medium ${
                        task.actual_hours > task.estimated_hours
                            ? 'text-red-600'
                            : 'text-gray-900'
                    }`}
                >
                    {task.actual_hours ?? 0}h
                </span>
                <span className="text-sm text-gray-400">
                    {' '}
                    / {task.estimated_hours}h
                </span>
                {task.actual_hours > task.estimated_hours && (
                    <p className="text-xs text-red-500">
                        +{task.actual_hours - task.estimated_hours}h
                    </p>
                )}
            </div>
        ),
    },
];
