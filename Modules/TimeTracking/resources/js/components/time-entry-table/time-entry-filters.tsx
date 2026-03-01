import { Filter, X } from 'lucide-react';
import { Task, TeamMember } from 'Modules/Project/resources/js/types/types';

interface TimeEntryFiltersProps {
    taskFilter: number | null;
    userFilter: number | null;
    tasks: Task[];
    users: { id: number; name: string }[];
    filteredCount: number;
    totalCount: number;
    onTaskChange: (value: number | null) => void;
    onUserChange: (value: number | null) => void;
    onClear: () => void;
}

export const TimeEntryFilters = ({
                                     taskFilter,
                                     userFilter,
                                     tasks,
                                     users,
                                     filteredCount,
                                     totalCount,
                                     onTaskChange,
                                     onUserChange,
                                     onClear,
                                 }: TimeEntryFiltersProps) => {
    const hasActiveFilters = !!(taskFilter || userFilter);

    return (
        <div className="flex items-center gap-2 pt-2">
            <Filter className="h-4 w-4 text-gray-400" />

            <select
                value={taskFilter ?? ''}
                onChange={(e) =>
                    onTaskChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                <option value="">Všetky úlohy</option>
                {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                        {task.title}
                    </option>
                ))}
            </select>

            <select
                value={userFilter ?? ''}
                onChange={(e) =>
                    onUserChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                <option value="">Všetci používatelia</option>
                {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name}
                    </option>
                ))}
            </select>

            {hasActiveFilters && (
                <>
                    <button
                        onClick={onClear}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="h-3 w-3" />
                        Zrušiť
                    </button>
                    <span className="text-xs text-gray-400">
                        {filteredCount} z {totalCount}
                    </span>
                </>
            )}
        </div>
    );
};
