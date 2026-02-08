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
import { useState } from 'react';

export const CreateProjectDialog = () => {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        status: 'planning',
        workload: 'medium',
        start_date: '',
        end_date: '',
        budget: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/project', {
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
                <Button variant="default" size="lg">
                    Nový projekt
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Vytvoriť nový projekt</DialogTitle>
                    <DialogDescription>
                        Zadajte základné informácie o projekte.
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
                            {processing ? 'Vytváram...' : 'Vytvoriť projekt'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
