import { FormDialog } from '@/components/dialogs/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { useMemo } from 'react';
import { Project } from 'Modules/Project/resources/js/types/types';

interface ManualEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projects: Project[];
    initialProjectId?: number | null;
}

export function ManualEntryDialog({
    open,
    onOpenChange,
    projects,
    initialProjectId,
}: ManualEntryDialogProps) {
    const currentUserId = usePage<SharedData>().props.auth.user.id;

    const defaultProjectId =
        initialProjectId ?? projects[0]?.id ?? '';

    const { data, setData, post, processing, errors, reset } = useForm({
        project_id: String(defaultProjectId),
        task_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        hours: '',
        description: '',
    });

    const selectedProject = useMemo(
        () => projects.find((p) => String(p.id) === data.project_id),
        [projects, data.project_id],
    );

    const canManageOnSelected = selectedProject?.current_user_permissions?.includes(
        'manage_time_entries',
    );

    const availableTasks = useMemo(() => {
        if (!selectedProject?.tasks) return [];
        if (canManageOnSelected) return selectedProject.tasks;
        return selectedProject.tasks.filter((task) =>
            task.assigned_users?.some((u) => u.id === currentUserId),
        );
    }, [selectedProject, canManageOnSelected, currentUserId]);

    const handleOpen = (next: boolean) => {
        if (next) {
            reset();
            setData({
                project_id: String(defaultProjectId),
                task_id: '',
                entry_date: new Date().toISOString().split('T')[0],
                hours: '',
                description: '',
            });
        }
        onOpenChange(next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.project_id) return;

        post(`/projects/${data.project_id}/time-entries`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            title="Manuálny záznam"
            description="Zaznamenaj odpracovaný čas pre vybraný projekt a úlohu."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť záznam"
        >
            <div className="space-y-4">
                <div>
                    <Label htmlFor="manual_project_id">Projekt *</Label>
                    <select
                        id="manual_project_id"
                        value={data.project_id}
                        onChange={(e) => {
                            setData('project_id', e.target.value);
                            setData('task_id', '');
                        }}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Vyberte projekt...</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <Label htmlFor="manual_task_id">Úloha *</Label>
                    <select
                        id="manual_task_id"
                        value={data.task_id}
                        onChange={(e) => setData('task_id', e.target.value)}
                        disabled={!availableTasks.length}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                    >
                        <option value="">
                            {availableTasks.length
                                ? 'Vyberte úlohu...'
                                : 'Žiadne dostupné úlohy'}
                        </option>
                        {availableTasks.map((task) => (
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
                        <Label htmlFor="manual_date">Dátum *</Label>
                        <Input
                            id="manual_date"
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
                        <Label htmlFor="manual_hours">Hodiny *</Label>
                        <Input
                            id="manual_hours"
                            type="number"
                            min="0.25"
                            max="24"
                            step="0.25"
                            value={data.hours}
                            onChange={(e) => setData('hours', e.target.value)}
                            placeholder="napr. 2.5"
                            className="mt-1"
                        />
                        {errors.hours && (
                            <p className="mt-1 text-xs text-red-500">{errors.hours}</p>
                        )}
                    </div>
                </div>

                <div>
                    <Label htmlFor="manual_description">Poznámka</Label>
                    <textarea
                        id="manual_description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Čo si robil..."
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
