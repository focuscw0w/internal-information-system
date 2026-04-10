import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
    AllocationOverride,
    AllocationRecord,
    DeadlineOverride,
    Person,
    ProjectOption,
    SimulationInputPayload,
    TeamChange,
    UserOption,
} from '../../types/simulation';

type Props = {
    users: UserOption[];
    projects: ProjectOption[];
    allocations: AllocationRecord[];
    baselinePeople: Person[];
    value: SimulationInputPayload;
    onChange: (payload: SimulationInputPayload) => void;
    onSubmit: () => void;
    onReset: () => void;
    loading: boolean;
};

function Section({
    title,
    children,
    defaultOpen = false,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-lg border bg-white">
            <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen((o) => !o)}
            >
                {title}
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {open && <div className="border-t px-4 py-3">{children}</div>}
        </div>
    );
}

export function SimulationForm({
    users,
    projects,
    allocations,
    baselinePeople,
    value,
    onChange,
    onSubmit,
    onReset,
    loading,
}: Props) {
    const setCapacity = (userId: number, hours?: number) => {
        const nextCapacities = { ...value.capacity_overrides };

        if (hours === undefined || Number.isNaN(hours)) {
            delete nextCapacities[userId];
        } else {
            nextCapacities[userId] = hours;
        }

        onChange({
            ...value,
            capacity_overrides: nextCapacities,
        });
    };

    const setAllocation = (idx: number, patch: Partial<AllocationOverride>) => {
        const updated = [...value.allocation_overrides];
        updated[idx] = { ...updated[idx], ...patch };
        onChange({ ...value, allocation_overrides: updated });
    };

    const removeAllocation = (idx: number) => {
        const updated = [...value.allocation_overrides];
        updated[idx] = { ...updated[idx], delete: true };
        onChange({ ...value, allocation_overrides: updated });
    };

    const addAllocation = () => {
        const newAlloc: AllocationOverride = {
            project_id: projects[0]?.id ?? 0,
            user_id: users[0]?.id ?? 0,
            allocated_hours: 0,
            percentage: 0,
            start_date: new Date().toISOString().slice(0, 10),
            end_date: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
            delete: false,
        };
        onChange({ ...value, allocation_overrides: [...value.allocation_overrides, newAlloc] });
    };

    const setDeadline = (projectId: number, newEndDate: string) => {
        const existing = value.deadline_overrides.find((d) => d.project_id === projectId);
        const updated: DeadlineOverride[] = existing
            ? value.deadline_overrides.map((d) =>
                  d.project_id === projectId ? { ...d, new_end_date: newEndDate } : d
              )
            : [...value.deadline_overrides, { project_id: projectId, new_end_date: newEndDate }];
        onChange({ ...value, deadline_overrides: updated });
    };

    const addTeamChange = (projectId: number, userId: number, action: 'add' | 'remove') => {
        const change: TeamChange = { project_id: projectId, user_id: userId, action };
        onChange({ ...value, team_changes: [...value.team_changes, change] });
    };

    const removeTeamChange = (idx: number) => {
        onChange({ ...value, team_changes: value.team_changes.filter((_, i) => i !== idx) });
    };

    // Capacity map (from original user list) for display
    const visibleAllocations = value.allocation_overrides.filter((a) => !a.delete);
    const existingAllocsByIdx = value.allocation_overrides
        .map((a, i) => ({ ...a, _idx: i }))
        .filter((a) => !a.delete);

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            className="space-y-3"
        >
            {/* Capacities */}
            <Section title="Kapacity zamestnancov" defaultOpen>
                <div className="space-y-2">
                    {users.map((user) => {
                        const baselineCapacity =
                            baselinePeople.find((person) => person.id === user.id)?.weekly_capacity_hours ?? '';
                        const current = value.capacity_overrides[user.id] ?? baselineCapacity;
                        return (
                            <div key={user.id} className="flex items-center gap-3">
                                <span className="w-40 truncate text-sm text-gray-700">{user.name}</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    placeholder="—"
                                    className="w-20 rounded border px-2 py-1 text-sm"
                                    value={current}
                                    onChange={(e) =>
                                        setCapacity(user.id, e.target.value ? Number(e.target.value) : undefined)
                                    }
                                />
                                <span className="text-xs text-gray-400">h/týždeň</span>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* Allocations */}
            <Section title="Alokácie na projektoch">
                <div className="space-y-3">
                    {/* Existing allocations */}
                    {allocations.map((alloc) => {
                        const overrideIdx = value.allocation_overrides.findIndex(
                            (a) => a.allocation_id === alloc.id
                        );
                        const override = overrideIdx >= 0 ? value.allocation_overrides[overrideIdx] : null;
                        const isDeleted = override?.delete ?? false;

                        return (
                            <div
                                key={alloc.id}
                                className={`rounded border p-3 text-sm ${isDeleted ? 'opacity-40' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{alloc.project?.name}</span>
                                        <span className="text-xs text-gray-500">{alloc.user?.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (overrideIdx >= 0) {
                                                removeAllocation(overrideIdx);
                                            } else {
                                                onChange({
                                                    ...value,
                                                    allocation_overrides: [
                                                        ...value.allocation_overrides,
                                                        {
                                                            project_id: alloc.project_id,
                                                            user_id: alloc.user_id,
                                                            allocation_id: alloc.id,
                                                            delete: true,
                                                        },
                                                    ],
                                                });
                                            }
                                        }}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                {!isDeleted && (
                                    <div className="mt-2 flex flex-wrap gap-3">
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-gray-500">%</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                className="w-16 rounded border px-2 py-1 text-xs"
                                                value={override?.percentage ?? alloc.percentage}
                                                onChange={(e) => {
                                                    if (overrideIdx >= 0) {
                                                        setAllocation(overrideIdx, { percentage: Number(e.target.value) });
                                                    } else {
                                                        onChange({
                                                            ...value,
                                                            allocation_overrides: [
                                                                ...value.allocation_overrides,
                                                                {
                                                                    project_id: alloc.project_id,
                                                                    user_id: alloc.user_id,
                                                                    allocation_id: alloc.id,
                                                                    percentage: Number(e.target.value),
                                                                },
                                                            ],
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-gray-500">h</label>
                                            <input
                                                type="number"
                                                min={0}
                                                className="w-20 rounded border px-2 py-1 text-xs"
                                                value={override?.allocated_hours ?? alloc.allocated_hours}
                                                onChange={(e) => {
                                                    if (overrideIdx >= 0) {
                                                        setAllocation(overrideIdx, { allocated_hours: Number(e.target.value) });
                                                    } else {
                                                        onChange({
                                                            ...value,
                                                            allocation_overrides: [
                                                                ...value.allocation_overrides,
                                                                {
                                                                    project_id: alloc.project_id,
                                                                    user_id: alloc.user_id,
                                                                    allocation_id: alloc.id,
                                                                    allocated_hours: Number(e.target.value),
                                                                },
                                                            ],
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-gray-500">Od</label>
                                            <input
                                                type="date"
                                                className="w-32 rounded border px-2 py-1 text-xs"
                                                value={override?.start_date ?? alloc.start_date?.slice(0, 10)}
                                                onChange={(e) => {
                                                    if (overrideIdx >= 0) {
                                                        setAllocation(overrideIdx, { start_date: e.target.value });
                                                    } else {
                                                        onChange({
                                                            ...value,
                                                            allocation_overrides: [
                                                                ...value.allocation_overrides,
                                                                {
                                                                    project_id: alloc.project_id,
                                                                    user_id: alloc.user_id,
                                                                    allocation_id: alloc.id,
                                                                    start_date: e.target.value,
                                                                },
                                                            ],
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-gray-500">Do</label>
                                            <input
                                                type="date"
                                                className="w-32 rounded border px-2 py-1 text-xs"
                                                value={override?.end_date ?? alloc.end_date?.slice(0, 10)}
                                                onChange={(e) => {
                                                    if (overrideIdx >= 0) {
                                                        setAllocation(overrideIdx, { end_date: e.target.value });
                                                    } else {
                                                        onChange({
                                                            ...value,
                                                            allocation_overrides: [
                                                                ...value.allocation_overrides,
                                                                {
                                                                    project_id: alloc.project_id,
                                                                    user_id: alloc.user_id,
                                                                    allocation_id: alloc.id,
                                                                    end_date: e.target.value,
                                                                },
                                                            ],
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* New allocations */}
                    {visibleAllocations
                        .filter((a) => !a.allocation_id)
                        .map((a) => {
                            const idx = value.allocation_overrides.indexOf(a);
                            return (
                                <div key={idx} className="rounded border border-dashed border-blue-300 p-3 text-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-blue-600">Nová alokácia</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange({
                                                    ...value,
                                                    allocation_overrides: value.allocation_overrides.filter((_, i) => i !== idx),
                                                });
                                            }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-500">Projekt</label>
                                            <select
                                                className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                                value={a.project_id}
                                                onChange={(e) => setAllocation(idx, { project_id: Number(e.target.value) })}
                                            >
                                                {projects.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Zamestnanec</label>
                                            <select
                                                className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                                value={a.user_id}
                                                onChange={(e) => setAllocation(idx, { user_id: Number(e.target.value) })}
                                            >
                                                {users.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">%</label>
                                            <input
                                                type="number" min={0} max={100}
                                                className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                                value={a.percentage ?? 0}
                                                onChange={(e) => setAllocation(idx, { percentage: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Hodiny</label>
                                            <input
                                                type="number" min={0}
                                                className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                                value={a.allocated_hours ?? 0}
                                                onChange={(e) => setAllocation(idx, { allocated_hours: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Od</label>
                                            <input
                                                type="date"
                                                className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                                value={a.start_date ?? ''}
                                                onChange={(e) => setAllocation(idx, { start_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Do</label>
                                            <input
                                                type="date"
                                                className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                                value={a.end_date ?? ''}
                                                onChange={(e) => setAllocation(idx, { end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    <button
                        type="button"
                        onClick={addAllocation}
                        className="w-full rounded border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600"
                    >
                        + Pridať alokáciu
                    </button>
                </div>
            </Section>

            {/* Deadlines */}
            <Section title="Termíny projektov">
                <div className="space-y-2">
                    {projects.map((project) => {
                        const override = value.deadline_overrides.find((d) => d.project_id === project.id);
                        return (
                            <div key={project.id} className="flex items-center gap-3">
                                <span className="flex-1 truncate text-sm text-gray-700">{project.name}</span>
                                <input
                                    type="date"
                                    className="rounded border px-2 py-1 text-sm"
                                    value={override?.new_end_date ?? project.end_date ?? ''}
                                    onChange={(e) => setDeadline(project.id, e.target.value)}
                                />
                            </div>
                        );
                    })}
                    {projects.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Žiadne aktívne projekty.</p>
                    )}
                </div>
            </Section>

            {/* Team changes */}
            <Section title="Členovia projektov">
                <div className="space-y-3">
                    {value.team_changes.map((change, idx) => {
                        const proj = projects.find((p) => p.id === change.project_id);
                        const usr = users.find((u) => u.id === change.user_id);
                        return (
                            <div key={idx} className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm">
                                <span>
                                    <span className={`mr-1 font-medium ${change.action === 'add' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {change.action === 'add' ? '+ Pridať' : '− Odobrať'}
                                    </span>
                                    {usr?.name} → {proj?.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeTeamChange(idx)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}

                    <div className="grid grid-cols-3 gap-2">
                        <select
                            id="tc-project"
                            className="rounded border px-2 py-1 text-xs"
                            defaultValue=""
                        >
                            <option value="" disabled>Projekt</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <select
                            id="tc-user"
                            className="rounded border px-2 py-1 text-xs"
                            defaultValue=""
                        >
                            <option value="" disabled>Zamestnanec</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => {
                                    const p = (document.getElementById('tc-project') as HTMLSelectElement)?.value;
                                    const u = (document.getElementById('tc-user') as HTMLSelectElement)?.value;
                                    if (p && u) addTeamChange(Number(p), Number(u), 'add');
                                }}
                                className="flex-1 rounded border bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                            >
                                + Pridať
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const p = (document.getElementById('tc-project') as HTMLSelectElement)?.value;
                                    const u = (document.getElementById('tc-user') as HTMLSelectElement)?.value;
                                    if (p && u) addTeamChange(Number(p), Number(u), 'remove');
                                }}
                                className="flex-1 rounded border bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                            >
                                − Odobrať
                            </button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Simulujem…' : 'Simulovať'}
                </Button>
                <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
                    Resetovať
                </Button>
            </div>
        </form>
    );
}
