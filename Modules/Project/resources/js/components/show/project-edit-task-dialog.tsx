import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { Task } from '../../types/project.types';

interface ProjectTaskEditDialogProps {
    task: Task;
    projectId: number;
    team: any[];
}

export const ProjectTaskEditDialog = ({ task, projectId, team }: ProjectTaskEditDialogProps) => {
    const [open, setOpen] = useState(false);
    
    const { data, setData, put, processing, errors, reset } = useForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        estimated_hours: task.estimated_hours?.toString() || '',
        due_date: task.due_date || '',
        assigned_to: task.assigned_to?.toString() || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/projects/${projectId}/tasks/${task.id}`, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Upraviť úlohu"
                >
                    <Edit size={18} />
                </button>
            </DialogTrigger>
            <DialogContent 
                className="max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>Upraviť úlohu</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Názov úlohy *</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Názov úlohy"
                            required
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Popis</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Popis úlohy"
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Stav *</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    setData('status', value as Task['status'])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">
                                        To Do
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                        In Progress
                                    </SelectItem>
                                    <SelectItem value="testing">
                                        Testing
                                    </SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="priority">Priorita *</Label>
                            <Select
                                value={data.priority}
                                onValueChange={(value) =>
                                    setData('priority', value as Task['priority'])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Nízka</SelectItem>
                                    <SelectItem value="medium">
                                        Stredná
                                    </SelectItem>
                                    <SelectItem value="high">Vysoká</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="estimated_hours">
                                Odhad hodín
                            </Label>
                            <Input
                                id="estimated_hours"
                                type="number"
                                step="0.5"
                                value={data.estimated_hours}
                                onChange={(e) =>
                                    setData('estimated_hours', e.target.value)
                                }
                                placeholder="8"
                            />
                        </div>

                        <div>
                            <Label htmlFor="due_date">Termín</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={data.due_date}
                                onChange={(e) =>
                                    setData('due_date', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="assigned_to">Priradený</Label>
                        <Select
                            value={data.assigned_to}
                            onValueChange={(value) =>
                                setData('assigned_to', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vyber používateľa" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=" ">Nepriradené</SelectItem>
                                {team.map((member) => (
                                    <SelectItem
                                        key={member.id}
                                        value={member.id.toString()}
                                    >
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={processing}
                        >
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Ukladám...' : 'Uložiť zmeny'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};