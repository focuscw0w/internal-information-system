import { FormDialog } from '@/components/dialogs/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Task } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../../types/types';

interface EditEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: TimeEntry;
    projectId: number;
    tasks: Task[];
}

export function EditEntryDialog({
    open,
    onOpenChange,
    entry,
    projectId,
    tasks,
}: EditEntryDialogProps) {
    const { data, setData, put, processing, errors } = useForm({
        task_id: String(entry.task_id),
        entry_date: entry.entry_date.substring(0, 10),
        hours: String(entry.hours),
        description: entry.description ?? '',
    });

    useEffect(() => {
        if (open) {
            setData({
                task_id: String(entry.task_id),
                entry_date: entry.entry_date.substring(0, 10),
                hours: String(entry.hours),
                description: entry.description ?? '',
            });
        }
    }, [open, entry.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/projects/${projectId}/time-entries/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Upraviť záznam"
            description="Uprav existujúci záznam o odpracovanom čase."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť zmeny"
        >
            <div className="space-y-4">
                <div>
                    <Label htmlFor="edit_task_id">Úloha *</Label>
                    <select
                        id="edit_task_id"
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

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="edit_date">Dátum *</Label>
                        <Input
                            id="edit_date"
                            type="date"
                            value={data.entry_date}
                            onChange={(e) => setData('entry_date', e.target.value)}
                            className="mt-1"
                        />
                        {errors.entry_date && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.entry_date}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="edit_hours">Hodiny *</Label>
                        <Input
                            id="edit_hours"
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
                </div>

                <div>
                    <Label htmlFor="edit_description">Poznámka</Label>
                    <textarea
                        id="edit_description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.description}
                        </p>
                    )}
                </div>
            </div>
        </FormDialog>
    );
}
