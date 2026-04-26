import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, Filter, LineChart, Search, Users, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import type { Person } from '../../types/capacity';
import { HistoryChart } from '../shared/history-chart';

type CapacityStatusFilter = 'all' | 'free' | 'risky' | 'overloaded';
type CapacitySortOption = 'utilization_desc' | 'name' | 'free_capacity_desc';

type PeopleCapacitySectionProps = {
    people: Person[];
    canManage: boolean;
    capacities: Record<number, number>;
    expandedPersonId: number | null;
    onCapacityChange: (userId: number, value: number) => void;
    onSubmitCapacity: (event: FormEvent, userId: number) => void;
    onToggleHistory: (userId: number) => void;
};

const STATUS_FILTER_OPTIONS: {
    value: CapacityStatusFilter;
    label: string;
}[] = [
    { value: 'all', label: 'Všetky stavy' },
    { value: 'free', label: 'Voľní' },
    { value: 'risky', label: 'Na hrane' },
    { value: 'overloaded', label: 'Nad kapacitou' },
];

const SORT_OPTIONS: { value: CapacitySortOption; label: string }[] = [
    { value: 'utilization_desc', label: 'Najvyššie vyťaženie' },
    { value: 'name', label: 'Meno A-Z' },
    { value: 'free_capacity_desc', label: 'Najviac voľných hodín' },
];

function formatHours(hours: number): string {
    return `${Number(hours).toFixed(Number.isInteger(hours) ? 0 : 1)}h`;
}

function statusLabel(person: Person): string {
    if (person.weekly_utilization > 100) return 'Nad kapacitou';
    if (person.weekly_utilization >= 80) return 'Na hrane';
    return 'Voľný';
}

function statusClassName(person: Person): string {
    if (person.weekly_utilization > 100) {
        return 'bg-red-100 text-red-700 hover:bg-red-100';
    }

    if (person.weekly_utilization >= 80) {
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
    }

    return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
}

function matchesStatus(person: Person, status: CapacityStatusFilter): boolean {
    if (status === 'free') return person.weekly_utilization < 80;
    if (status === 'risky') {
        return (
            person.weekly_utilization >= 80 && person.weekly_utilization <= 100
        );
    }
    if (status === 'overloaded') return person.weekly_utilization > 100;
    return true;
}

function CapacityLoadCell({
    load,
    capacity,
    utilization,
}: {
    load: number;
    capacity: number;
    utilization: number;
}) {
    return (
        <div className="min-w-40 pr-6">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-gray-900">
                    {formatHours(load)}
                </span>
                <span className="text-xs text-gray-500">
                    / {formatHours(capacity)}
                </span>
            </div>
            <Progress
                value={Math.min(100, utilization)}
                className="mt-2 h-2 bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">{utilization}%</p>
        </div>
    );
}

export function PeopleCapacitySection({
    people,
    canManage,
    capacities,
    expandedPersonId,
    onCapacityChange,
    onSubmitCapacity,
    onToggleHistory,
}: PeopleCapacitySectionProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] =
        useState<CapacityStatusFilter>('all');
    const [sortBy, setSortBy] =
        useState<CapacitySortOption>('utilization_desc');

    const hasActiveFilters = Boolean(search || statusFilter !== 'all');

    const filteredPeople = useMemo(() => {
        const query = search.trim().toLowerCase();

        return people
            .filter((person) => {
                const matchesSearch =
                    !query ||
                    person.name.toLowerCase().includes(query) ||
                    person.email.toLowerCase().includes(query);

                return matchesSearch && matchesStatus(person, statusFilter);
            })
            .sort((a, b) => {
                if (sortBy === 'name')
                    return a.name.localeCompare(b.name, 'sk');
                if (sortBy === 'free_capacity_desc') {
                    return b.free_capacity_hours - a.free_capacity_hours;
                }

                return b.weekly_utilization - a.weekly_utilization;
            });
    }, [people, search, sortBy, statusFilter]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const columns: Column<Person>[] = [
        {
            key: 'person',
            label: 'Používateľ',
            width: 'min-w-56',
            render: (person) => (
                <div className="min-w-56">
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {person.email}
                    </p>
                </div>
            ),
        },
        {
            key: 'week',
            label: 'Týždeň',
            width: 'min-w-44',
            render: (person) => (
                <CapacityLoadCell
                    load={person.weekly_load_hours}
                    capacity={person.weekly_capacity_hours}
                    utilization={person.weekly_utilization}
                />
            ),
        },
        {
            key: 'month',
            label: 'Mesiac',
            width: 'min-w-44',
            render: (person) => (
                <CapacityLoadCell
                    load={person.monthly_load_hours}
                    capacity={person.monthly_capacity_hours}
                    utilization={person.monthly_utilization}
                />
            ),
        },
        {
            key: 'free',
            label: 'Voľné',
            width: 'min-w-24',
            render: (person) => (
                <span className="text-sm font-medium text-gray-900">
                    {formatHours(person.free_capacity_hours)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Stav',
            width: 'min-w-32',
            render: (person) => (
                <Badge className={statusClassName(person)}>
                    {statusLabel(person)}
                </Badge>
            ),
        },
        {
            key: 'trend',
            label: 'Trend',
            align: 'center',
            width: 'w-28',
            render: (person) => {
                const isOpen = expandedPersonId === person.id;

                return (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleHistory(person.id)}
                        className="min-w-24"
                    >
                        <LineChart className="h-4 w-4" />
                        <ChevronDown
                            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </Button>
                );
            },
        },
        {
            key: 'actions',
            label: 'Kapacita',
            align: 'right',
            width: 'min-w-48',
            render: (person) => {
                if (!canManage) {
                    return (
                        <span className="text-sm text-gray-500">
                            {formatHours(person.weekly_capacity_hours)}
                        </span>
                    );
                }

                const currentValue =
                    capacities[person.id] ?? person.weekly_capacity_hours;
                const hasChanged =
                    currentValue !== person.weekly_capacity_hours;

                return (
                    <form
                        onSubmit={(event) => onSubmitCapacity(event, person.id)}
                        className="flex min-w-48 items-center justify-end gap-2"
                    >
                        <input
                            type="number"
                            min={1}
                            max={100}
                            className="h-8 w-20 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                            value={currentValue}
                            onChange={(event) =>
                                onCapacityChange(
                                    person.id,
                                    Number(event.target.value),
                                )
                            }
                        />
                        <Button
                            type="submit"
                            size="sm"
                            variant={hasChanged ? 'default' : 'secondary'}
                            disabled={!hasChanged}
                        >
                            Uložiť
                        </Button>
                    </form>
                );
            },
        },
    ];

    return (
        <section>
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="space-y-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                Tímová kapacita
                            </CardTitle>
                            <p className="mt-1 text-sm text-gray-500">
                                {filteredPeople.length} z {people.length}{' '}
                                používateľov
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-64 flex-1 sm:max-w-md">
                            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Hľadať meno alebo email..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-md border border-gray-200 bg-white py-1.5 pr-3 pl-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target
                                            .value as CapacityStatusFilter,
                                    )
                                }
                                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                            >
                                {STATUS_FILTER_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(event) =>
                                    setSortBy(
                                        event.target
                                            .value as CapacitySortOption,
                                    )
                                }
                                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-gray-500"
                            >
                                <X className="h-4 w-4" />
                                Zrušiť filtre
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <div className="min-w-[980px]">
                        <DataTable
                            columns={columns}
                            data={filteredPeople}
                            keyExtractor={(person) => person.id}
                            emptyIcon={
                                <Users className="h-8 w-8 text-gray-400" />
                            }
                            emptyTitle="Žiadni používatelia"
                            emptyDescription={
                                hasActiveFilters
                                    ? 'Upravte filtre alebo vyhľadávanie.'
                                    : 'V systéme zatiaľ nie sú používatelia s kapacitnými dátami.'
                            }
                            emptyAction={
                                hasActiveFilters ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        Zrušiť filtre
                                    </Button>
                                ) : undefined
                            }
                            renderExpandedRow={(person) =>
                                expandedPersonId === person.id ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="border-b border-gray-100 bg-gray-50 px-4 py-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        12-týždenný trend
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {person.name}
                                                    </p>
                                                </div>
                                                <Badge
                                                    className={statusClassName(
                                                        person,
                                                    )}
                                                >
                                                    {person.weekly_utilization}%
                                                </Badge>
                                            </div>
                                            {person.history.length > 0 ? (
                                                <HistoryChart
                                                    data={person.history}
                                                    height={150}
                                                />
                                            ) : (
                                                <p className="py-6 text-center text-sm text-gray-500">
                                                    Trend zatiaľ nemá dáta.
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ) : null
                            }
                        />
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
