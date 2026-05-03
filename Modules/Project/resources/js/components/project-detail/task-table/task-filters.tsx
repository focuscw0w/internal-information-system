import { Filter, Search, X } from 'lucide-react';
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
    searchQuery: string;
    statusFilter: TaskStatus | null;
    priorityFilter: TaskPriority | null;
    assigneeFilter: number | null;
    assignees: { id: number; name: string }[];
    filteredCount: number;
    totalCount: number;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: TaskStatus | null) => void;
    onPriorityChange: (value: TaskPriority | null) => void;
    onAssigneeChange: (value: number | null) => void;
    onClear: () => void;
}

export const TaskFilters = ({
    searchQuery,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    assignees,
    filteredCount,
    totalCount,
    onSearchChange,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
    onClear,
}: TaskFiltersProps) => {
    const hasActiveFilters =
        searchQuery || statusFilter || priorityFilter || assigneeFilter;

    return (
        <div className="command-bar mt-3 w-full">
            <div className="field-wrap command-bar__search">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Hľadať úlohu..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input input--with-icon w-full"
                />
            </div>
            <div className="command-bar__filters">
                <Filter className="h-4 w-4 text-muted-foreground" />

                <select
                    value={statusFilter ?? ''}
                    onChange={(e) =>
                        onStatusChange((e.target.value as TaskStatus) || null)
                    }
                    className="select text-xs"
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
                        onPriorityChange(
                            (e.target.value as TaskPriority) || null,
                        )
                    }
                    className="select text-xs"
                >
                    <option value="">Všetky priority</option>
                    {priorityFilterOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {assignees.length > 0 && (
                <select
                    value={assigneeFilter ?? ''}
                    onChange={(e) =>
                        onAssigneeChange(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    className="select text-xs"
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
                        className="btn btn--ghost btn--sm"
                    >
                        <X className="h-3 w-3" />
                        Zrušiť filtre
                    </button>
                    <span className="text-xs text-muted-foreground">
                        {filteredCount} z {totalCount}
                    </span>
                </>
            )}
        </div>
    );
};
