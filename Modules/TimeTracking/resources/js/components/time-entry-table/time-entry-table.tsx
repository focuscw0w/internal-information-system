import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Filter } from 'lucide-react';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { Project } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../../types/types';
import { TimeEntryFilters } from './time-entry-filters';
import { TimeEntryActions } from './time-entry-actions';
import { CreateTimeEntryDialog } from './dialogs/create-time-entry';

interface TimeEntryTableProps {
    project: Project;
    entries: TimeEntry[];
}

const DAY_NAMES = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];

/**
 * Format date string to "7. 3. 2026 · piatok".
 */
const formatDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    });
    const dayName = DAY_NAMES[date.getDay()];
    return `${formatted} · ${dayName}`;
};

/**
 * Group entries by date (YYYY-MM-DD).
 */
const groupByDate = (entries: TimeEntry[]): Record<string, TimeEntry[]> => {
    const groups: Record<string, TimeEntry[]> = {};

    entries.forEach((entry) => {
        const date = entry.entry_date.substring(0, 10);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(entry);
    });

    return groups;
};

export const TimeEntryTable = ({ project, entries }: TimeEntryTableProps) => {
    const currentUserId = usePage<SharedData>().props.auth.user.id;
    const permissions = project.current_user_permissions ?? [];
    const canManageTeam = permissions.includes('manage_team');

    const [taskFilter, setTaskFilter] = useState<number | null>(null);
    const [userFilter, setUserFilter] = useState<number | null>(null);

    const hasActiveFilters = !!(taskFilter || userFilter);

    const clearFilters = () => {
        setTaskFilter(null);
        setUserFilter(null);
    };

    const tasks = project.tasks ?? [];

    const users = entries
        .map((e) => e.user)
        .filter((u): u is NonNullable<typeof u> => !!u)
        .filter((u, i, arr) => arr.findIndex((a) => a.id === u.id) === i);

    const showUserColumn = users.length > 1;

    const filteredEntries = entries.filter((entry) => {
        if (taskFilter && entry.task_id !== taskFilter) return false;
        if (userFilter && entry.user_id !== userFilter) return false;
        return true;
    });

    const totalHours = filteredEntries.reduce((sum, e) => sum + Number(e.hours), 0);

    const grouped = groupByDate(filteredEntries);
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">
                            Záznamy času
                            {entries.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({filteredEntries.length} záznamov · {totalHours.toFixed(1)}h)
                                </span>
                            )}
                        </CardTitle>
                    </div>
                    <CreateTimeEntryDialog
                        project={project}
                        tasks={tasks}
                    />
                </div>

                {entries.length > 0 && (
                    <TimeEntryFilters
                        taskFilter={taskFilter}
                        userFilter={userFilter}
                        project={project}
                        tasks={tasks}
                        users={users}
                        filteredCount={filteredEntries.length}
                        totalCount={entries.length}
                        onTaskChange={setTaskFilter}
                        onUserChange={setUserFilter}
                        onClear={clearFilters}
                    />
                )}
            </CardHeader>
            <CardContent className="p-0">
                {sortedDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        {hasActiveFilters ? (
                            <>
                                <Filter className="mb-3 h-10 w-10 text-gray-300" />
                                <p className="text-sm text-gray-500">
                                    Žiadne záznamy nezodpovedajú filtrom.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 text-sm text-blue-500 hover:underline"
                                >
                                    Zrušiť filtre
                                </button>
                            </>
                        ) : (
                            <>
                                <Clock className="mb-3 h-12 w-12 text-gray-300" />
                                <p className="text-sm text-gray-500">
                                    Zatiaľ nie sú zaznamenané žiadne hodiny
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Začnite zaznamenávať čas strávený na úlohách.
                                </p>
                                <div className="mt-4">
                                    <CreateTimeEntryDialog
                                        project={project}
                                        tasks={tasks}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    sortedDates.map((date) => {
                        const dayEntries = grouped[date];
                        const dayTotal = dayEntries.reduce(
                            (sum, e) => sum + Number(e.hours),
                            0,
                        );

                        return (
                            <div key={date}>
                                {/* Date header */}
                                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-2.5">
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDateHeader(date)}
                                    </span>
                                    <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                        {dayTotal.toFixed(1)}h
                                    </span>
                                </div>

                                {/* Entries for this date */}
                                {dayEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-4 border-b border-gray-50 px-5 py-2.5 transition-colors hover:bg-gray-50/50"
                                    >
                                        {/* Task name */}
                                        <span className="flex-1 text-sm text-gray-900">
                                            {entry.task?.title ?? '–'}
                                        </span>

                                        {/* User name (only when multiple users visible) */}
                                        {showUserColumn && (
                                            <span className="w-36 truncate text-xs text-gray-500">
                                                {entry.user?.name ?? '–'}
                                            </span>
                                        )}

                                        {/* Description */}
                                        <span className="w-40 truncate text-xs text-gray-400">
                                            {entry.description ?? '–'}
                                        </span>

                                        {/* Hours badge */}
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                            {Number(entry.hours).toFixed(1)}h
                                        </span>

                                        {/* Actions */}
                                        <div className="flex w-16 justify-end">
                                            {canManageTeam || entry.user_id === currentUserId ? (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <TimeEntryActions
                                                        entry={entry}
                                                        projectId={project.id}
                                                        tasks={tasks}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};