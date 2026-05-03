import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import type { FormEvent } from 'react';
import type { Person } from '../../types/capacity';
import { HistoryChart } from '../shared/history-chart';
import { StatusBadge } from '../shared/utilization';

type PeopleCapacitySectionProps = {
    people: Person[];
    canManage: boolean;
    capacities: Record<number, number>;
    expandedHistory: Record<number, boolean>;
    onCapacityChange: (userId: number, value: number) => void;
    onSubmitCapacity: (event: FormEvent, userId: number) => void;
    onToggleHistory: (userId: number) => void;
};

export function PeopleCapacitySection({
    people,
    canManage,
    capacities,
    expandedHistory,
    onCapacityChange,
    onSubmitCapacity,
    onToggleHistory,
}: PeopleCapacitySectionProps) {
    return (
        <section>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Dashboard kapacít
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {people.map((person) => (
                        <Card key={person.id} className="gap-4 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="font-medium">{person.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {person.email}
                                    </p>
                                </div>
                                <StatusBadge
                                    utilization={person.weekly_utilization}
                                />
                            </div>

                            <p className="text-sm text-gray-600">
                                Týždeň: {person.weekly_load_hours}h /{' '}
                                {person.weekly_capacity_hours}h | Mesiac:{' '}
                                {person.monthly_load_hours}h /{' '}
                                {person.monthly_capacity_hours}h
                            </p>

                            {canManage && (
                                <form
                                    onSubmit={(event) =>
                                        onSubmitCapacity(event, person.id)
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <label className="text-xs text-gray-500">
                                        Týždenná kapacita (h)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        className="w-24 rounded border px-2 py-1 text-sm"
                                        value={
                                            capacities[person.id] ??
                                            person.weekly_capacity_hours
                                        }
                                        onChange={(event) =>
                                            onCapacityChange(
                                                person.id,
                                                Number(event.target.value),
                                            )
                                        }
                                    />
                                    <Button type="submit" size="sm">
                                        Uložiť
                                    </Button>
                                </form>
                            )}

                            <Collapsible
                                open={!!expandedHistory[person.id]}
                                onOpenChange={() => onToggleHistory(person.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100">
                                        <span>12-týždenný trend</span>
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${expandedHistory[person.id] ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    {person.history.length > 0 && (
                                        <div className="mt-2">
                                            <HistoryChart
                                                data={person.history}
                                                height={130}
                                            />
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </section>
    );
}
