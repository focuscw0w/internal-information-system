import { Filter, X } from 'lucide-react';
import { Project, Task } from 'Modules/Project/resources/js/types/types';

interface TimeEntryFiltersProps {
    taskFilter: number | null;
    userFilter: number | null;
    dateFromFilter: string;
    dateToFilter: string;
    tasks: Task[];
    users: { id: number; name: string }[];
    filteredCount: number;
    project: Project;
    totalCount: number;
    onTaskChange: (value: number | null) => void;
    onUserChange: (value: number | null) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onClear: () => void;
}

export const TimeEntryFilters = ({
    taskFilter,
    userFilter,
    dateFromFilter,
    dateToFilter,
    tasks,
    users,
    filteredCount,
    totalCount,
    onTaskChange,
    onUserChange,
    onDateFromChange,
    onDateToChange,
    onClear,
}: TimeEntryFiltersProps) => {
    const hasDateRange = !!(dateFromFilter || dateToFilter);
    const hasActiveFilters = !!(taskFilter || userFilter || hasDateRange);

    return (
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-slate-500 shadow-sm ring-1 ring-slate-100">
                        <Filter className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-sm font-medium text-slate-800">
                            Filtre záznamov
                        </p>
                        <p className="text-xs text-slate-500">
                            Zúžte výber podľa úlohy, osoby alebo obdobia.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-100">
                        {filteredCount} z {totalCount}
                    </span>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-card px-3 text-xs font-medium whitespace-nowrap text-slate-500 shadow-sm ring-1 ring-slate-100 transition-colors hover:text-slate-700"
                        >
                            <X className="h-3.5 w-3.5" />
                            Zrušiť filtre
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <section className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Filtrovanie
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                            value={taskFilter ?? ''}
                            onChange={(e) =>
                                onTaskChange(
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : null,
                                )
                            }
                            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-card px-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">Všetky úlohy</option>
                            {tasks.map((task) => (
                                <option key={task.id} value={task.id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>

                        {users.length > 1 && (
                            <select
                                value={userFilter ?? ''}
                                onChange={(e) =>
                                    onUserChange(
                                        e.target.value
                                            ? parseInt(e.target.value)
                                            : null,
                                    )
                                }
                                className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-card px-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">Všetci používatelia</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </section>

                <section className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Obdobie
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="shrink-0">Od</span>
                            <input
                                type="date"
                                value={dateFromFilter}
                                onChange={(e) =>
                                    onDateFromChange(e.target.value)
                                }
                                className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-card px-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                        </label>

                        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="shrink-0">Do</span>
                            <input
                                type="date"
                                value={dateToFilter}
                                onChange={(e) => onDateToChange(e.target.value)}
                                className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-card px-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                        </label>
                    </div>
                </section>
            </div>
        </div>
    );
};
