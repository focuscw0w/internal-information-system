import { useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import { SharedData } from '@/types';
import { Project } from 'Modules/Project/resources/js/types/types';

interface QuickAddCardProps {
    projects: Project[];
}

export function QuickAddCard({ projects }: QuickAddCardProps) {
    const currentUserId = usePage<SharedData>().props.auth.user.id;

    const { data, setData, post, processing, errors, reset } = useForm({
        project_id: String(projects[0]?.id ?? ''),
        task_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        hours: '2',
        description: '',
    });

    const selectedProject = useMemo(
        () => projects.find((p) => String(p.id) === data.project_id),
        [projects, data.project_id],
    );

    const canManage = selectedProject?.current_user_permissions?.includes(
        'manage_time_entries',
    );

    const availableTasks = useMemo(() => {
        if (!selectedProject?.tasks) return [];
        if (canManage) return selectedProject.tasks;
        return selectedProject.tasks.filter((task) =>
            task.assigned_users?.some((u) => u.id === currentUserId),
        );
    }, [selectedProject, canManage, currentUserId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.project_id) return;

        post(`/projects/${data.project_id}/time-entries`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setData({
                    project_id: String(selectedProject?.id ?? ''),
                    task_id: '',
                    entry_date: new Date().toISOString().split('T')[0],
                    hours: '2',
                    description: '',
                });
            },
        });
    };

    return (
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Pridať záznam</h3>
            </div>
            <form className="card__body space-y-3" onSubmit={handleSubmit}>
                <FormField label="Projekt" error={errors.task_id ? undefined : undefined}>
                    <select
                        className="select w-full"
                        value={data.project_id}
                        onChange={(e) => {
                            setData('project_id', e.target.value);
                            setData('task_id', '');
                        }}
                    >
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Úloha" error={errors.task_id}>
                    <select
                        className="select w-full"
                        value={data.task_id}
                        onChange={(e) => setData('task_id', e.target.value)}
                        disabled={!availableTasks.length}
                    >
                        <option value="">
                            {availableTasks.length
                                ? 'Vyber úlohu...'
                                : 'Žiadne dostupné úlohy'}
                        </option>
                        {availableTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                                {task.title}
                            </option>
                        ))}
                    </select>
                </FormField>
                <div className="grid grid-cols-2 gap-2">
                    <FormField label="Dátum" error={errors.entry_date}>
                        <input
                            type="date"
                            className="input w-full"
                            value={data.entry_date}
                            onChange={(e) => setData('entry_date', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Hodiny" error={errors.hours}>
                        <input
                            type="number"
                            className="input w-full"
                            value={data.hours}
                            onChange={(e) => setData('hours', e.target.value)}
                            step={0.25}
                            min={0.25}
                            max={24}
                        />
                    </FormField>
                </div>
                <FormField label="Poznámka" error={errors.description}>
                    <textarea
                        className="textarea min-h-16 w-full"
                        placeholder="Čo si robil..."
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                </FormField>
                <button
                    type="submit"
                    className="btn btn--primary w-full"
                    disabled={processing}
                >
                    <Plus className="h-4 w-4" />
                    {processing ? 'Ukladám...' : 'Uložiť záznam'}
                </button>
            </form>
        </section>
    );
}

function FormField({
    label,
    children,
    error,
}: {
    label: string;
    children: ReactNode;
    error?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {label}
            </span>
            {children}
            {error ? (
                <span className="mt-1 block text-xs text-red-500">{error}</span>
            ) : null}
        </label>
    );
}
