import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { useForm } from '@inertiajs/react';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import {
    Project,
    ProjectStatus,
    WorkloadLevel,
} from '../../../types/project.types';

interface EditProjectDialogProps {
    project: Project;
}

export const EditProjectDialog = ({ project }: EditProjectDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        workload: project.workload || 'medium',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        budget: project.budget?.toString() || '',
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            // Refresh data pri každom otvorení
            setData({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'planning',
                workload: project.workload || 'medium',
                start_date: project.start_date || '',
                end_date: project.end_date || '',
                budget: project.budget?.toString() || '',
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

    const statusOptions = [
        { value: 'planning', label: 'Plánovanie' },
        { value: 'active', label: 'Aktívny' },
        { value: 'on_hold', label: 'Pozastavený' },
        { value: 'completed', label: 'Dokončený' },
        { value: 'cancelled', label: 'Zrušený' },
    ];

    const workloadOptions = [
        { value: 'low', label: 'Nízke' },
        { value: 'medium', label: 'Stredné' },
        { value: 'high', label: 'Vysoké' },
    ];

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Upraviť projekt"
                >
                    <Edit size={20} />
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
        </FormDialog>
    );
};
