import { FormDialog } from '@/components/dialogs/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Task } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../../../types/types';

interface EditTimeEntryDialogProps {
    entry: TimeEntry;
    projectId: number;
    tasks: Task[];
}

export const EditTimeEntryDialog = ({
                                        entry,
                                        projectId,
                                        tasks,
                                    }: EditTimeEntryDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        task_id: String(entry.task_id),
        entry_date: entry.entry_date,
        hours: String(entry.hours),
        description: entry.description ?? '',
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData({
                task_id: String(entry.task_id),
                entry_date: entry.entry_date,
                hours: String(entry.hours),
                description: entry.description ?? '',
            });
        }
        setOpen(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/projects/${projectId}/time-entries/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <Button variant="ghost" size="sm">
                    <Pencil className="h-3.5 w-3.5 text-gray-500" />
                </Button>
            }
            title="Upraviť záznam"
            description="Upravte existujúci záznam o odpracovanom čase."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť zmeny"
        >
            <div className="space-y-4">
                {/* Task */}
                <div>
                    <Label htmlFor="task_id">Úloha *</Label>
                    <select
                        id="task_id"
                        value={data.task_id}
                        onChange={(e) => setData('task_id', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Vyberte úlohu...</option>
                        {tasks.map((task) => (
                            <option key={task.id} value={task.id}>
                                {task.title}
                            </option>
                        ))}
                    </select>
                    {errors.task_id && (
                        <p className="mt-1 text-xs text-red-500">{errors.task_id}</p>
                    )}
                </div>

                {/* Date */}
                <div>
                    <Label htmlFor="entry_date">Dátum *</Label>
                    <Input
                        id="entry_date"
                        type="date"
                        value={data.entry_date}
                        onChange={(e) => setData('entry_date', e.target.value)}
                        className="mt-1"
                    />
                    {errors.entry_date && (
                        <p className="mt-1 text-xs text-red-500">{errors.entry_date}</p>
                    )}
                </div>

                {/* Hours */}
                <div>
                    <Label htmlFor="hours">Hodiny *</Label>
                    <Input
                        id="hours"
                        type="number"
                        min="0.25"
                        max="24"
                        step="0.25"
                        value={data.hours}
                        onChange={(e) => setData('hours', e.target.value)}
                        className="mt-1"
                    />
                    {errors.hours && (
                        <p className="mt-1 text-xs text-red-500">{errors.hours}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <Label htmlFor="description">Popis</Label>
                    <textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Čo ste robili..."
                        rows={3}
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                    )}
                </div>
            </div>
        </FormDialog>
    );
};
