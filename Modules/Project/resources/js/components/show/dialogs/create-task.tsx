import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TeamMember } from '../../../types/types';
interface CreateTaskDialogProps {
    projectId: number;
    team: TeamMember[];
}

export function CreateTaskDialog({ projectId, team }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        estimated_hours: '',
        due_date: '',
        assigned_to: '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${projectId}/tasks`, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    const statusOptions = [
        { value: 'todo', label: 'Na vykonanie' },
        { value: 'in_progress', label: 'Prebieha' },
        { value: 'testing', label: 'Testovanie' },
        { value: 'done', label: 'Hotovo' },
    ];

    const priorityOptions = [
        { value: 'low', label: 'Nízka' },
        { value: 'medium', label: 'Stredná' },
        { value: 'high', label: 'Vysoká' },
    ];

    const teamOptions = [
        { value: '0', label: 'Nepriradené' },
        ...team.map((member) => ({
            value: member.id.toString(),
            label: member.name,
        })),
    ];

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button
                    size="default"
                    className="bg-primary hover:bg-primary/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Pridať úlohu
                </Button>
            }
            title="Vytvoriť novú úlohu"
            description="Pridajte detaily novej úlohy pre projekt"
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Vytvoriť úlohu"
        >
            <FormField
                label="Názov úlohy"
                id="title"
                value={data.title}
                onChange={(value) => setData('title', value)}
                error={errors.title}
                required
                placeholder="napr. Implementovať login funkciu"
            />

            <FormField
                label="Popis"
                id="description"
                type="textarea"
                value={data.description}
                onChange={(value) => setData('description', value)}
                error={errors.description}
                placeholder="Detailný popis úlohy..."
                rows={3}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                    label="Status"
                    id="status"
                    type="select"
                    value={data.status}
                    onChange={(value) => setData('status', value)}
                    error={errors.status}
                    options={statusOptions}
                />

                <FormField
                    label="Priorita"
                    id="priority"
                    type="select"
                    value={data.priority}
                    onChange={(value) => setData('priority', value)}
                    error={errors.priority}
                    options={priorityOptions}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                    label="Odhadované hodiny"
                    id="estimated_hours"
                    type="number"
                    value={data.estimated_hours}
                    onChange={(value) => setData('estimated_hours', value)}
                    error={errors.estimated_hours}
                    placeholder="napr. 8"
                    min="0"
                    step="0.5"
                />

                <FormField
                    label="Deadline"
                    id="due_date"
                    type="date"
                    value={data.due_date}
                    onChange={(value: string) => setData('due_date', value)}
                    error={errors.due_date}
                />
            </div>

            {/* TODO: Viacerí môžu byť priradení */}
            <FormField
                label="Priradiť používateľovi"
                id="assigned_to"
                type="select"
                value={data.assigned_to}
                onChange={(value) => setData('assigned_to', value)}
                error={errors.assigned_to}
                options={teamOptions}
                placeholder="Vybrať používateľa"
            />
        </FormDialog>
    );
}
