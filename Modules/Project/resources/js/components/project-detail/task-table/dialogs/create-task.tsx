import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { TaskStatus, TeamMember } from '../../../../types/types';
import { TeamMemberSelect } from '../../../ui/team-member-select';
interface CreateTaskDialogProps {
    projectId: number;
    team: TeamMember[];
    initialStatus?: TaskStatus;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreateTaskDialog({
    projectId,
    team,
    initialStatus = 'todo',
    trigger,
    open,
    onOpenChange,
}: CreateTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const dialogOpen = isControlled ? open : internalOpen;
    const setDialogOpen = onOpenChange ?? setInternalOpen;

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        status: initialStatus,
        priority: 'medium',
        estimated_hours: '',
        start_date: '',
        due_date: '',
        assigned_users: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${projectId}/tasks`, {
            onSuccess: () => {
                setDialogOpen(false);
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
        { value: 'urgent', label: 'Urgentná' },
    ];

    return (
        <FormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            trigger={
                trigger ?? (
                    <Button
                        size="default"
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Pridať úlohu
                    </Button>
                )
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
                    onChange={(value) => setData('status', value as TaskStatus)}
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
                    label="Dátum začiatku"
                    id="start_date"
                    type="date"
                    value={data.start_date}
                    onChange={(value: string) => setData('start_date', value)}
                    error={errors.start_date}
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

            <TeamMemberSelect
                allUsers={team}
                selectedMembers={data.assigned_users}
                onChange={(members) => setData('assigned_users', members)}
            />
        </FormDialog>
    );
}
