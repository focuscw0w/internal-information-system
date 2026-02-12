import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { useUsers } from '@/hooks/use-users';
import { useForm } from '@inertiajs/react';
import { AlertCircle, Edit, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
    Project,
    ProjectStatus,
    WorkloadLevel,
} from '../../../types/project.types';
import { TeamMemberSelect } from '../../team-member-select';
import { statusOptions, workloadOptions } from './config';

interface EditProjectDialogProps {
    project: Project;
    text?: string;
}

export const EditProjectDialog = ({
    project,
    text,
}: EditProjectDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data: users = [], isLoading, isError, error } = useUsers();

    const initialTeamMembers = project.team.map((member) => member.id);
    const initialTeamSettings = project.team.reduce(
        (acc, member) => {
            acc[member.id] = {
                allocation: member.allocation || 100,
                permissions: member.permissions || ['view'],
            };
            return acc;
        },
        {} as Record<number, any>,
    );

    const { data, setData, put, processing, errors } = useForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        workload: project.workload || 'medium',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        budget: project.budget?.toString() || '',
        team_members: initialTeamMembers,
        team_settings: initialTeamSettings,
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'planning',
                workload: project.workload || 'medium',
                start_date: project.start_date || '',
                end_date: project.end_date || '',
                budget: project.budget?.toString() || '',
                team_members: initialTeamMembers,
                team_settings: initialTeamSettings,
            });
        }
        setOpen(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/projects/${project.id}`, {
            onSuccess: () => setOpen(false),
            onError: (errors) => console.error('Validation errors:', errors),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Upraviť projekt"
                >
                    <Edit size={20} />
                    <span className="text-sm">{text}</span>
                </button>
            }
            title="Upraviť projekt"
            description="Upravte informácie o projekte."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť zmeny"
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

            {/* Loading state */}
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

            {/* TeamMemberSelect */}
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
