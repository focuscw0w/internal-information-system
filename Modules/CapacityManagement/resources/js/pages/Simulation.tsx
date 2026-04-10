import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ComparisonPanel } from '../components/simulation/ComparisonPanel';
import { SimulationForm } from '../components/simulation/SimulationForm';
import { AlertDiffList } from '../components/simulation/AlertDiffList';
import { SuggestionList } from '../components/simulation/SuggestionList';
import type {
    AllocationRecord,
    ProjectOption,
    SimulationInputPayload,
    SimulationResult,
    UserOption,
} from '../types/simulation';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kapacitný dashboard', href: '/capacity-management' },
    { title: 'Simulácia', href: '/capacity-management/simulation' },
];

const emptyInput = (): SimulationInputPayload => ({
    capacity_overrides: {},
    allocation_overrides: [],
    deadline_overrides: [],
    team_changes: [],
});

export default function Simulation({
    simulation,
    can_manage,
    users,
    projects,
    allocations,
}: {
    simulation: SimulationResult;
    can_manage: boolean;
    users: UserOption[];
    projects: ProjectOption[];
    allocations: AllocationRecord[];
}) {
    const [formInput, setFormInput] = useState<SimulationInputPayload>(emptyInput());
    const [loading, setLoading] = useState(false);

    const runSimulation = (payload: SimulationInputPayload = formInput) => {
        setLoading(true);

        // Prune capacity_overrides: remove undefined/NaN entries
        const cleanCapacities: Record<number, number> = {};
        for (const [k, v] of Object.entries(payload.capacity_overrides)) {
            if (v && !isNaN(Number(v))) {
                cleanCapacities[Number(k)] = Number(v);
            }
        }

        router.post(
            '/capacity-management/simulation/run',
            {
                ...payload,
                capacity_overrides: cleanCapacities,
            } as unknown as Record<string, unknown>,
            {
                preserveState: true,
                preserveScroll: true,
                only: ['simulation'],
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleApplySuggestion = (change: Partial<SimulationInputPayload>) => {
        const merged: SimulationInputPayload = {
            capacity_overrides: { ...formInput.capacity_overrides, ...(change.capacity_overrides ?? {}) },
            allocation_overrides: [
                ...formInput.allocation_overrides,
                ...(change.allocation_overrides ?? []),
            ],
            deadline_overrides: [
                ...formInput.deadline_overrides,
                ...(change.deadline_overrides ?? []),
            ],
            team_changes: [...formInput.team_changes, ...(change.team_changes ?? [])],
        };
        setFormInput(merged);
        runSimulation(merged);
    };

    const handleReset = () => {
        const fresh = emptyInput();
        setFormInput(fresh);
        runSimulation(fresh);
    };

    if (!can_manage) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Simulácia kapacít" />
                <div className="p-6 text-gray-500">Nemáte oprávnenie na zobrazenie tejto stránky.</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Simulácia kapacít" />

            <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Simulácia kapacitného manažmentu</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Navrhni zmeny a okamžite uvidíš dopad — nič sa neukladá.
                        </p>
                    </div>
                    <Link
                        href="/capacity-management"
                        className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        ← Dashboard
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                    {/* Left column: form */}
                    <div>
                        <SimulationForm
                            users={users}
                            projects={projects}
                            allocations={allocations}
                            value={formInput}
                            onChange={setFormInput}
                            onSubmit={() => runSimulation()}
                            onReset={handleReset}
                            loading={loading}
                        />
                    </div>

                    {/* Right column: results */}
                    <div className="space-y-4">
                        {/* Alert diff */}
                        <AlertDiffList delta={simulation.delta} />

                        {/* Comparison metrics */}
                        <ComparisonPanel
                            baseline={simulation.baseline}
                            simulated={simulation.simulated}
                            delta={simulation.delta}
                        />

                        {/* Suggestions */}
                        <div className="rounded-lg border bg-white p-4">
                            <h3 className="mb-3 text-sm font-medium text-gray-700">
                                Návrhy systému ({simulation.suggestions.length})
                            </h3>
                            <SuggestionList
                                suggestions={simulation.suggestions}
                                onApply={handleApplySuggestion}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
