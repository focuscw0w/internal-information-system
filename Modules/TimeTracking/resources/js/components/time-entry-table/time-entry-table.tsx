import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Column, DataTable } from '@/components/ui/data-table';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Clock, Filter } from 'lucide-react';
import { Project } from 'Modules/Project/resources/js/types/types';
import { useState } from 'react';
import { TimeEntry } from '../../types/types';
import { CreateTimeEntryDialog } from './dialogs/create-time-entry';
import { TimeEntryActions } from './time-entry-actions';
import { timeEntryColumns } from './time-entry-columns';
import { TimeEntryFilters } from './time-entry-filters';

interface TimeEntryTableProps {
    project: Project;
    entries: TimeEntry[];
}

export const TimeEntryTable = ({ project, entries }: TimeEntryTableProps) => {
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

    const currentUserId = usePage<SharedData>().props.auth.user.id;
    const permissions = project.current_user_permissions ?? [];
    const canManageTeam = permissions.includes('manage_team');

    const allColumns: Column<TimeEntry>[] = [
        ...timeEntryColumns,
        {
            key: 'actions',
            label: 'Akcie',
            width: 'w-24',
            align: 'center' as const,
            render: (entry: TimeEntry) =>
                canManageTeam || entry.user_id === currentUserId ? (
                    <div onClick={(e) => e.stopPropagation()}>
                        <TimeEntryActions
                            entry={entry}
                            projectId={project.id}
                            tasks={tasks}
                        />
                    </div>
                ) : null,
        },
    ];

    return (
        <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">
                            Záznamy času
                            {entries.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({filteredEntries.length} záznamov ·{' '}
                                    {totalHours.toFixed(1)}h)
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
            <CardContent>
                <DataTable<TimeEntry>
                    columns={allColumns}
                    data={filteredEntries}
                    keyExtractor={(entry) => entry.id}
                    emptyIcon={
                        hasActiveFilters ? (
                            <Filter className="h-10 w-10 text-gray-300" />
                        ) : (
                            <Clock className="h-12 w-12 text-gray-300" />
                        )
                    }
                    emptyTitle={
                        hasActiveFilters
                            ? 'Žiadne záznamy nezodpovedajú filtrom.'
                            : 'Zatiaľ nie sú zaznamenané žiadne hodiny'
                    }
                    emptyDescription={
                        !hasActiveFilters
                            ? 'Začnite zaznamenávať čas strávený na úlohách.'
                            : undefined
                    }
                    emptyAction={
                        hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-500 hover:underline"
                            >
                                Zrušiť filtre
                            </button>
                        ) : (
                            <CreateTimeEntryDialog
                                project={project}
                                tasks={tasks}
                            />
                        )
                    }
                />
            </CardContent>
        </Card>
    );
};
