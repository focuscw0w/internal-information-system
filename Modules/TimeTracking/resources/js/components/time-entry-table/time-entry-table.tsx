import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Project } from 'Modules/Project/resources/js/types/types';
import { useState } from 'react';
import { TimeEntry } from '../../types/types';
import { CreateTimeEntryDialog } from './dialogs/create-time-entry';
import { TimeEntryDayGroup } from './time-entry-day-group';
import { TimeEntryEmpty } from './time-entry-empty';
import { TimeEntryFilters } from './time-entry-filters';

interface TimeEntryTableProps {
    project: Project;
    entries: TimeEntry[];
}

const groupByDate = (entries: TimeEntry[]): Record<string, TimeEntry[]> => {
    const groups: Record<string, TimeEntry[]> = {};
    entries.forEach((entry) => {
        const date = entry.entry_date.substring(0, 10);
        if (!groups[date]) groups[date] = [];
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

    const filteredEntries = entries.filter((entry) => {
        if (taskFilter && entry.task_id !== taskFilter) return false;
        if (userFilter && entry.user_id !== userFilter) return false;
        return true;
    });

    const totalHours = filteredEntries.reduce(
        (sum, e) => sum + Number(e.hours),
        0,
    );
    const grouped = groupByDate(filteredEntries);
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const canEdit = (entry: TimeEntry) =>
        canManageTeam || entry.user_id === currentUserId;

    return (
        <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Záznamy času
                        {entries.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({filteredEntries.length} záznamov ·{' '}
                                {totalHours.toFixed(1)}h)
                            </span>
                        )}
                    </CardTitle>
                    <CreateTimeEntryDialog project={project} tasks={tasks} />
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
                    <TimeEntryEmpty
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        project={project}
                        tasks={tasks}
                    />
                ) : (
                    sortedDates.map((date) => (
                        <TimeEntryDayGroup
                            key={date}
                            date={date}
                            entries={grouped[date]}
                            projectId={project.id}
                            tasks={tasks}
                            showUserColumn={users.length > 1}
                            canEdit={canEdit}
                        />
                    ))
                )}
            </CardContent>
        </Card>
    );
};
