import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/use-users';
import { useForm } from '@inertiajs/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { statusOptions, workloadOptions } from '../../../config';
import {
    ProjectStatus,
    TeamMemberSettings,
    WorkloadLevel,
} from '../../../types/types';
import { TeamMemberSelect } from '../../team-member-select';

interface CreateProjectFormData {
    name: string;
    description: string;
    status: ProjectStatus;
    workload: WorkloadLevel;
    start_date: string;
    end_date: string;
    budget: string;
    team_members: number[]; // ✅ Explicitný typ
    team_settings: Record<number, TeamMemberSettings>; // ✅ Explicitný typ
}

export const CreateProjectDialog = () => {
    const [open, setOpen] = useState(false);

    const { data: users = [], isLoading, isError } = useUsers();

    // ✅ Použiť generický typ
    const { data, setData, post, processing, errors, reset } =
        useForm<CreateProjectFormData>({
            name: '',
            description: '',
            status: 'planning',
            workload: 'medium',
            start_date: '',
            end_date: '',
            budget: '',
            team_members: [],
            team_settings: {},
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/projects', {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button variant="default" size="lg">
                    Nový projekt
                </Button>
            }
            title="Vytvoriť nový projekt"
            description="Zadajte základné informácie o projekte."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Vytvoriť projekt"
        >
            <FormField
                label="Názov projektu"
                id="name"
                value={data.name}
                onChange={(value) => setData('name', value)}
                error={errors.name}
                required
                placeholder="napr. Redizajn e-shopu"
            />

            <FormField
                label="Popis"
                id="description"
                type="textarea"
                value={data.description}
                onChange={(value) => setData('description', value)}
                error={errors.description}
                placeholder="Stručný popis projektu..."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                    label="Dátum začiatku"
                    id="start_date"
                    type="date"
                    value={data.start_date}
                    onChange={(value) => setData('start_date', value)}
                    error={errors.start_date}
                    required
                />

                <FormField
                    label="Dátum konca"
                    id="end_date"
                    type="date"
                    value={data.end_date}
                    onChange={(value) => setData('end_date', value)}
                    error={errors.end_date}
                    required
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                    label="Stav"
                    id="status"
                    type="select"
                    value={data.status}
                    onChange={(value) =>
                        setData('status', value as ProjectStatus)
                    }
                    error={errors.status}
                    options={statusOptions}
                />

                <FormField
                    label="Vyťaženie"
                    id="workload"
                    type="select"
                    value={data.workload}
                    onChange={(value) =>
                        setData('workload', value as WorkloadLevel)
                    }
                    error={errors.workload}
                    options={workloadOptions}
                />
            </div>

            <FormField
                label="Rozpočet (€)"
                id="budget"
                type="number"
                value={data.budget}
                onChange={(value) => setData('budget', value)}
                error={errors.budget}
                placeholder="napr. 25000"
                min="0"
                step="0.01"
            />

            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="ml-2 text-gray-600">
                        Načítavam používateľov...
                    </span>
                </div>
            )}

            {isError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600">
                    <AlertCircle size={20} />
                    <span>
                        Nepodarilo sa načítať používateľov. Skúste to znova.
                    </span>
                </div>
            )}

            {!isLoading && !isError && (
                <TeamMemberSelect
                    allUsers={users}
                    selectedMembers={data.team_members}
                    teamSettings={data.team_settings}
                    onChange={(members, settings) => {
                        setData('team_members', members);
                        setData('team_settings', settings);
                    }}
                    error={errors.team_members}
                />
            )}
        </FormDialog>
    );
};
