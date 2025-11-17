import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface FormInput {
    name: string;
    client: string;
    description: string;
    status: string;
    priority: string;
    start_date: string;
    due_date: string;
    tags: string;
}

export function AddProjectForm() {
    const { data, errors, processing, post, reset, setData } =
        useForm<FormInput>({
            name: '',
            client: '',
            description: '',
            status: 'planned',
            priority: 'medium',
            start_date: '',
            due_date: '',
            tags: '',
        });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        post('/projects', {
            onSuccess: () => reset(),
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Názov projektu</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Marketing Website Redesign"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="client">Klient</Label>
                        <Input
                            id="client"
                            value={data.client}
                            onChange={(e) => setData('client', e.target.value)}
                            placeholder="ACME s.r.o."
                        />
                        {errors.client && (
                            <p className="text-sm text-red-500">
                                {errors.client}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Popis</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Krátky popis projektu a jeho cieľov..."
                        className="min-h-[120px]"
                    />
                    {errors.description && (
                        <p className="text-sm text-red-500">
                            {errors.description}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) =>
                                setData('status', value as FormInput['status'])
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vyber status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="on_hold">On hold</SelectItem>
                                <SelectItem value="completed">
                                    Completed
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-sm text-red-500">
                                {errors.status}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Priorita</Label>
                        <Select
                            value={data.priority}
                            onValueChange={(value) =>
                                setData(
                                    'priority',
                                    value as FormInput['priority'],
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vyber prioritu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.priority && (
                            <p className="text-sm text-red-500">
                                {errors.priority}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="start_date">Od</Label>
                        <Input
                            id="start_date"
                            type="date"
                            value={data.start_date}
                            onChange={(e) =>
                                setData('start_date', e.target.value)
                            }
                        />
                        {errors.start_date && (
                            <p className="text-sm text-red-500">
                                {errors.start_date}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Do</Label>
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

                <div className="space-y-2">
                    <Label htmlFor="tags">Pomocné tagy</Label>
                    <Input
                        id="tags"
                        value={data.tags}
                        onChange={(e) => setData('tags', e.target.value)}
                        placeholder="design, web, q4"
                    />
                    {errors.tags && (
                        <p className="text-sm text-red-500">{errors.tags}</p>
                    )}
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => reset()}
                    >
                        Resetovať
                    </Button>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Ukladám...' : 'Vytvoriť projekt'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
