import { Filter, X } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../../../types/types';

const statusFilterOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'testing', label: 'Testing' },
    { value: 'done', label: 'Hotovo' },
];

const priorityFilterOptions: { value: TaskPriority; label: string }[] = [
    { value: 'high', label: 'Vysoká' },
    { value: 'medium', label: 'Stredná' },
    { value: 'low', label: 'Nízka' },
];

interface TaskFiltersProps {
    statusFilter: TaskStatus | null;
    priorityFilter: TaskPriority | null;
    assigneeFilter: number | null;
    assignees: { id: number; name: string }[];
    filteredCount: number;
    totalCount: number;
    onStatusChange: (value: TaskStatus | null) => void;
    onPriorityChange: (value: TaskPriority | null) => void;
    onAssigneeChange: (value: number | null) => void;
    onClear: () => void;
}

export const TaskFilters = ({
    statusFilter,
    priorityFilter,
    assigneeFilter,
    assignees,
    filteredCount,
    totalCount,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
    onClear,
}: TaskFiltersProps) => {
    const hasActiveFilters = statusFilter || priorityFilter || assigneeFilter;

    return (
        <div className="flex flex-wrap items-center gap-2 pt-2">
            <Filter className="h-4 w-4 text-gray-400" />

            <select
                value={statusFilter ?? ''}
                onChange={(e) =>
                    onStatusChange((e.target.value as TaskStatus) || null)
                }
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
                <option value="">Všetky stavy</option>
                {statusFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            <select
                value={priorityFilter ?? ''}
                onChange={(e) =>
                    onPriorityChange((e.target.value as TaskPriority) || null)
                }
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
                <option value="">Všetky priority</option>
                {priorityFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {assignees.length > 0 && (
                <select
                    value={assigneeFilter ?? ''}
                    onChange={(e) =>
                        onAssigneeChange(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="">Všetci členovia</option>
                    {assignees.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name}
                        </option>
                    ))}
                </select>
            )}

            {hasActiveFilters && (
                <>
                    <button
                        onClick={onClear}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="h-3 w-3" />
                        Zrušiť filtre
                    </button>
                    <span className="text-xs text-gray-400">
                        {filteredCount} z {totalCount}
                    </span>
                </>
            )}
        </div>
    );
};
