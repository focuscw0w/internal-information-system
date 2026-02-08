import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface ProjectCreateTaskDialogProps {
    projectId: number;
    //  users: User[];
}

export function ProjectCreateTaskDialog({
    projectId,
}: ProjectCreateTaskDialogProps) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        estimated_hours: '',
        due_date: '',
        assigned_to: '', // String pre Select value
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(`/projects/${projectId}/tasks`, {
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
                <Button
                    size="default"
                    className="bg-primary hover:bg-primary/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Pridať úlohu
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Vytvoriť novú úlohu</DialogTitle>
                    <DialogDescription>
                        Pridajte detaily novej úlohy pre projekt
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Názov úlohy */}
                        <div className="grid gap-2">
                            <Label htmlFor="title">
                                Názov úlohy{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="napr. Implementovať login funkciu"
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                required
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Popis */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Popis</Label>
                            <Textarea
                                id="description"
                                placeholder="Detailný popis úlohy..."
                                rows={3}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Status a Priorita - Side by side */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) =>
                                        setData('status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">
                                            Na vykonanie
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                            Prebieha
                                        </SelectItem>
                                        <SelectItem value="testing">
                                            Testovanie
                                        </SelectItem>
                                        <SelectItem value="done">
                                            Hotovo
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-sm text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priorita</Label>
                                <Select
                                    value={data.priority}
                                    onValueChange={(value) =>
                                        setData('priority', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            Nízka
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            Stredná
                                        </SelectItem>
                                        <SelectItem value="high">
                                            Vysoká
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.priority && (
                                    <p className="text-sm text-red-500">
                                        {errors.priority}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Odhadované hodiny a Deadline - Side by side */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="estimated_hours">
                                    Odhadované hodiny
                                </Label>
                                <Input
                                    id="estimated_hours"
                                    type="number"
                                    min="0"
                                    placeholder="napr. 8"
                                    value={data.estimated_hours}
                                    onChange={(e) =>
                                        setData(
                                            'estimated_hours',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.estimated_hours && (
                                    <p className="text-sm text-red-500">
                                        {errors.estimated_hours}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="due_date">Deadline</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) =>
                                        setData('due_date', e.target.value)
                                    }
                                />
                                {errors.due_date && (
                                    <p className="text-sm text-red-500">
                                        {errors.due_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ✅ Select pre používateľov */}
                        <div className="grid gap-2">
                            <Label htmlFor="assigned_to">
                                Priradiť používateľovi
                            </Label>
                            <Select
                                value={data.assigned_to}
                                onValueChange={(value) =>
                                    setData('assigned_to', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Vybrať používateľa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Prázdna možnosť */}
                                    <SelectItem value="t">
                                        Nepriradené
                                    </SelectItem>

                                    {/* Mapovanie používateľov */}
                                    {/*
                                    {users.map((user) => (
                                        <SelectItem 
                                            key={user.id} 
                                            value={user.id.toString()}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{user.name}</span>
                                                <span className="text-xs text-gray-500">
                                                    ({user.email})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                      */}
                                    <SelectItem key={1} value="Filip">
                                        <div className="flex items-center gap-2">
                                            <span>Filip</span>
                                            <span className="text-xs text-gray-500">
                                                test@gmail.com
                                            </span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.assigned_to && (
                                <p className="text-sm text-red-500">
                                    {errors.assigned_to}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Zrušiť
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Vytváram...' : 'Vytvoriť úlohu'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
