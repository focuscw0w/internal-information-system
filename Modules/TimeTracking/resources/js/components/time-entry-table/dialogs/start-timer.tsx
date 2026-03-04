import { FormDialog } from '@/components/dialogs/form-dialog';
import { Label } from '@/components/ui/label';
import { useTimer } from '../../../context/timer-context';
import { useState, useEffect } from 'react';
import { Project } from 'Modules/Project/resources/js/types/types';
import axios from 'axios';

interface StartTimerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const StartTimerDialog = ({
                                     open,
                                     onOpenChange,
                                 }: StartTimerDialogProps) => {
    const { startTimer } = useTimer();

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const selectedProject = projects.find(
        (p) => p.id === parseInt(selectedProjectId),
    );
    const tasks = selectedProject?.tasks ?? [];

    useEffect(() => {
        if (open) {
            setLoading(true);
            axios
                .get('/api/v1/projects')
                .then((res) => setProjects(res.data.data ?? res.data))
                .catch(() => setProjects([]))
                .finally(() => setLoading(false));
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const project = projects.find((p) => p.id === parseInt(selectedProjectId));
        const task = tasks.find((t) => t.id === parseInt(selectedTaskId));

        if (!project || !task) return;

        startTimer(
            { id: project.id, name: project.name },
            { id: task.id, title: task.title },
        );

        setSelectedProjectId('');
        setSelectedTaskId('');
        onOpenChange(false);
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Spustiť časovač"
            description="Vyberte projekt a úlohu na ktorej budete pracovať."
            onSubmit={handleSubmit}
            processing={false}
            submitLabel="Spustiť"
        >
            <div className="space-y-4">
                {loading ? (
                    <p className="text-sm text-gray-500">Načítavam projekty...</p>
                ) : (
                    <>
                        {/* Project */}
                        <div>
                            <Label htmlFor="timer_project">Projekt *</Label>
                            <select
                                id="timer_project"
                                value={selectedProjectId}
                                onChange={(e) => {
                                    setSelectedProjectId(e.target.value);
                                    setSelectedTaskId('');
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

                        {/* Task */}
                        <div>
                            <Label htmlFor="timer_task">Úloha *</Label>
                            <select
                                id="timer_task"
                                value={selectedTaskId}
                                onChange={(e) => setSelectedTaskId(e.target.value)}
                                disabled={!selectedProjectId}
                                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {selectedProjectId
                                        ? 'Vyberte úlohu...'
                                        : 'Najskôr vyberte projekt'}
                                </option>
                                {tasks.map((task) => (
                                    <option key={task.id} value={task.id}>
                                        {task.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>
        </FormDialog>
    );
};
