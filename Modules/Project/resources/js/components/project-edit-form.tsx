import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { useEffect } from 'react';

interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    workload: string;
    start_date: string;
    end_date: string;
    budget: string;
}

interface ProjectEditFormProps {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProjectEditForm = ({
    project,
    open,
    onOpenChange,
}: ProjectEditFormProps) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        status: 'planning',
        workload: 'medium',
        start_date: '',
        end_date: '',
        budget: '',
    });

    // Naplniť form dátami projektu pri otvorení
    useEffect(() => {
        if (project && open) {
            setData({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'planning',
                workload: project.workload || 'medium',
                start_date: project.start_date || '',
                end_date: project.end_date || '',
                budget: project.budget || '',
            });
        }
    }, [project, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!project) return;

        put(`/project/${project.id}`, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
        });
    };

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upraviť projekt</DialogTitle>
                    <DialogDescription>
                        Upravte informácie o projekte.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Názov projektu */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Názov projektu{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="napr. Redizajn e-shopu"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Popis */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Popis</Label>
                            <Textarea
                                id="description"
                                placeholder="Stručný popis projektu..."
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                rows={3}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Dátumy - Side by side */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">
                                    Dátum začiatku{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData('start_date', e.target.value)
                                    }
                                    required
                                />
                                {errors.start_date && (
                                    <p className="text-sm text-red-500">
                                        {errors.start_date}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="end_date">
                                    Dátum konca{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) =>
                                        setData('end_date', e.target.value)
                                    }
                                    required
                                />
                                {errors.end_date && (
                                    <p className="text-sm text-red-500">
                                        {errors.end_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status a Workload - Side by side */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Stav</Label>
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
                                        <SelectItem value="planning">
                                            Plánovanie
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Aktívny
                                        </SelectItem>
                                        <SelectItem value="on_hold">
                                            Pozastavený
                                        </SelectItem>
                                        <SelectItem value="completed">
                                            Dokončený
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Zrušený
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
                                <Label htmlFor="workload">Vyťaženie</Label>
                                <Select
                                    value={data.workload}
                                    onValueChange={(value) =>
                                        setData('workload', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            Nízke
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            Stredné
                                        </SelectItem>
                                        <SelectItem value="high">
                                            Vysoké
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.workload && (
                                    <p className="text-sm text-red-500">
                                        {errors.workload}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Budget */}
                        <div className="grid gap-2">
                            <Label htmlFor="budget">Rozpočet (€)</Label>
                            <Input
                                id="budget"
                                type="number"
                                placeholder="napr. 25000"
                                value={data.budget}
                                onChange={(e) =>
                                    setData('budget', e.target.value)
                                }
                                min="0"
                                step="0.01"
                            />
                            {errors.budget && (
                                <p className="text-sm text-red-500">
                                    {errors.budget}
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
                            {processing ? 'Ukladám...' : 'Uložiť zmeny'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
