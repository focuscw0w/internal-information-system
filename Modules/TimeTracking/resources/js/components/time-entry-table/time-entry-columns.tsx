import { Column } from '@/components/ui/data-table';
import { TimeEntry } from '../../types/types';

export const timeEntryColumns: Column<TimeEntry>[] = [
    {
        key: 'entry_date',
        label: 'Dátum',
        width: 'w-28',
        render: (entry) => (
            <span className="text-sm text-gray-900">
                {new Date(entry.entry_date).toLocaleDateString('sk-SK')}
            </span>
        ),
    },
    {
        key: 'task',
        label: 'Úloha',
        render: (entry) => (
            <span className="text-sm text-gray-900">
                {entry.task?.title ?? '–'}
            </span>
        ),
    },
    {
        key: 'user',
        label: 'Používateľ',
        width: 'w-40',
        render: (entry) => (
            <span className="text-sm text-gray-600">
                {entry.user?.name ?? '–'}
            </span>
        ),
    },
    {
        key: 'hours',
        label: 'Hodiny',
        width: 'w-24',
        align: 'center',
        render: (entry) => (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {entry.hours}h
            </span>
        ),
    },
    {
        key: 'description',
        label: 'Popis',
        render: (entry) => (
            <span className="text-sm text-gray-500 truncate max-w-xs block">
                {entry.description ?? '–'}
            </span>
        ),
    },
];
