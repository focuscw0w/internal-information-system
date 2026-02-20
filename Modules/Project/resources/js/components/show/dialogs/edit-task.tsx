import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { useForm } from '@inertiajs/react';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { Task, TeamMember } from '../../../types/types';

interface EditTaskDialogProps {
    task: Task;
    projectId: number;
    team: TeamMember[];
}

export const EditTaskDialog = ({
    task,
    projectId,
    team,
}: EditTaskDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        estimated_hours: task.estimated_hours?.toString() || '',
        due_date: task.due_date || '',
        assigned_to: task.assigned_to?.toString() || '',
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                estimated_hours: task.estimated_hours?.toString() || '',
                due_date: task.due_date || '',
                assigned_to: task.assigned_to?.toString() || '',
            });
        }
        setOpen(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/projects/${projectId}/tasks/${task.id}`, {
            onSuccess: () => setOpen(false),
        });
    };

    const statusOptions = [
        { value: 'todo', label: 'To Do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'testing', label: 'Testing' },
        { value: 'done', label: 'Done' },
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
            onOpenChange={handleOpen}
            trigger={
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Upraviť úlohu"
                >
                    <Edit size={18} />
                </button>
            }
            title="Upraviť úlohu"
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť zmeny"
        >
            <FormField
                label="Názov úlohy"
                id="title"
                value={data.title}
                onChange={(value) => setData('title', value)}
                error={errors.title}
                required
                placeholder="Názov úlohy"
            />

            <FormField
                label="Popis"
                id="description"
                type="textarea"
                value={data.description}
                onChange={(value) => setData('description', value)}
                placeholder="Popis úlohy"
                rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    label="Stav"
                    id="status"
                    type="select"
                    value={data.status}
                    onChange={(value) =>
                        setData('status', value as Task['status'])
                    }
                    error={errors.status}
                    options={statusOptions}
                    required
                />

                <FormField
                    label="Priorita"
                    id="priority"
                    type="select"
                    value={data.priority}
                    onChange={(value) =>
                        setData('priority', value as Task['priority'])
                    }
                    error={errors.priority}
                    options={priorityOptions}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    label="Odhad hodín"
                    id="estimated_hours"
                    type="number"
                    value={data.estimated_hours}
                    onChange={(value) => setData('estimated_hours', value)}
                    placeholder="8"
                    step="0.5"
                />

                <FormField
                    label="Termín"
                    id="due_date"
                    type="date"
                    value={data.due_date}
                    onChange={(value) => setData('due_date', value)}
                />
            </div>

            {/* TODO: Viacerí môžu byť priradení */}
            <FormField
                label="Priradený"
                id="assigned_to"
                type="select"
                value={data.assigned_to}
                onChange={(value) => setData('assigned_to', value)}
                options={teamOptions}
                placeholder="Vyber používateľa"
            />
        </FormDialog>
    );
};
