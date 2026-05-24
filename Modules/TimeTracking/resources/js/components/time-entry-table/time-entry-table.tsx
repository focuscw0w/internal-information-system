import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    const permissions = project.current_user_permissions ?? [];
    const canManageTimeEntries = permissions.includes('manage_time_entries');

    const [taskFilter, setTaskFilter] = useState<number | null>(null);
    const [userFilter, setUserFilter] = useState<number | null>(null);
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    const hasActiveFilters = !!(
        taskFilter ||
        userFilter ||
        dateFromFilter ||
        dateToFilter
    );
    const clearFilters = () => {
        setTaskFilter(null);
        setUserFilter(null);
        setDateFromFilter('');
        setDateToFilter('');
    };

    const tasks = project.tasks ?? [];
    const users = entries
        .map((e) => e.user)
        .filter((u): u is NonNullable<typeof u> => !!u)
        .filter((u, i, arr) => arr.findIndex((a) => a.id === u.id) === i);

    const filteredEntries = entries.filter((entry) => {
        const entryDate = entry.entry_date.substring(0, 10);

        if (taskFilter && entry.task_id !== taskFilter) return false;
        if (userFilter && entry.user_id !== userFilter) return false;
        if (dateFromFilter && entryDate < dateFromFilter) return false;
        if (dateToFilter && entryDate > dateToFilter) return false;
        return true;
    });

    const totalHours = filteredEntries.reduce(
        (sum, e) => sum + Number(e.hours),
        0,
    );
    const grouped = groupByDate(filteredEntries);
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const canEdit = (_entry: TimeEntry) => canManageTimeEntries;

    return (
        <Card>
            <CardHeader className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="text-base">Záznamy</CardTitle>
                        {entries.length > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {filteredEntries.length} záznamov ·{' '}
                                {totalHours.toFixed(1)}h zobrazených
                            </p>
                        )}
                    </div>

                    <CreateTimeEntryDialog project={project} tasks={tasks} />
                </div>

                {entries.length > 0 && (
                    <TimeEntryFilters
                        taskFilter={taskFilter}
                        userFilter={userFilter}
                        dateFromFilter={dateFromFilter}
                        dateToFilter={dateToFilter}
                        project={project}
                        tasks={tasks}
                        users={users}
                        filteredCount={filteredEntries.length}
                        totalCount={entries.length}
                        onTaskChange={setTaskFilter}
                        onUserChange={setUserFilter}
                        onDateFromChange={setDateFromFilter}
                        onDateToChange={setDateToFilter}
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
