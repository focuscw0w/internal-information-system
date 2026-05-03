import { TimeEntry } from '../../types/types';
import { Task } from 'Modules/Project/resources/js/types/types';
import { TimeEntryActions } from './time-entry-actions';

interface TimeEntryDayGroupProps {
    date: string;
    entries: TimeEntry[];
    projectId: number;
    tasks: Task[];
    showUserColumn: boolean;
    canEdit: (entry: TimeEntry) => boolean;
}

const DAY_NAMES = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];

const formatDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    });
    return `${formatted} · ${DAY_NAMES[date.getDay()]}`;
};

export const TimeEntryDayGroup = ({
    date,
    entries,
    projectId,
    tasks,
    showUserColumn,
    canEdit,
}: TimeEntryDayGroupProps) => {
    const dayTotal = entries.reduce((sum, e) => sum + Number(e.hours), 0);

    return (
        <div>
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-2.5">
                <span className="text-sm font-medium text-gray-900">
                    {formatDateHeader(date)}
                </span>
                <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {dayTotal.toFixed(1)}h
                </span>
            </div>

            {entries.map((entry) => (
                <div
                    key={entry.id}
                    className="flex items-center gap-4 border-b border-gray-50 px-5 py-2.5 transition-colors hover:bg-gray-50/50"
                >
                    <span className="flex-1 text-sm text-gray-900">
                        {entry.task?.title ?? '–'}
                    </span>

                    {showUserColumn && (
                        <span className="w-36 truncate text-xs text-gray-500">
                            {entry.user?.name ?? '–'}
                        </span>
                    )}

                    <span className="w-40 truncate text-xs text-gray-400">
                        {entry.description ?? '–'}
                    </span>

                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {Number(entry.hours).toFixed(1)}h
                    </span>

                    <div className="flex w-16 justify-end">
                        {canEdit(entry) ? (
                            <div onClick={(e) => e.stopPropagation()}>
                                <TimeEntryActions
                                    entry={entry}
                                    projectId={projectId}
                                    tasks={tasks}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
};