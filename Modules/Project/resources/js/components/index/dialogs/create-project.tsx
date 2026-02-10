import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';

export const CreateProjectDialog = () => {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        status: 'planning',
        workload: 'medium',
        start_date: '',
        end_date: '',
        budget: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/projects', {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
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
                    onChange={(value) => setData('status', value)}
                    error={errors.status}
                    options={statusOptions}
                />

                <FormField
                    label="Vyťaženie"
                    id="workload"
                    type="select"
                    value={data.workload}
                    onChange={(value) => setData('workload', value)}
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
