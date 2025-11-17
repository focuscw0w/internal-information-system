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
import { Project } from '../types/Project';

interface FormProps {
    project: Project;
}

interface FormInput {
    name: string;
    description: string;
    status: string;
    priority: string;
    start_date: string;
    due_date: string;
    tags: string;
}

export default function EditProjectForm({ project }: FormProps) {
    const { data, errors, processing, put, reset, setData } =
        useForm<FormInput>({
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority,
            start_date: project.start_date,
            due_date: project.due_date,
            tags: project.tags ?? '',
        });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        put(`projects/${project.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
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
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Popis</Label>
                    <Textarea
                        id="description"
                        className="min-h-[120px]"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Krátky popis projektu a jeho cieľov..."
                    />
                    {errors.description && (
                        <p className="text-sm text-red-500">
                            {errors.description}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

                    <div className="space-y-2">
                        <Label htmlFor="tags">Tagy</Label>
                        <Input
                            id="tags"
                            value={data.tags}
                            onChange={(e) => setData('tags', e.target.value)}
                            placeholder="design, web, q1"
                        />
                        {errors.tags && (
                            <p className="text-sm text-red-500">
                                {errors.tags}
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

                <Separator />

                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                        disabled={processing}
                    >
                        Zrušiť zmeny
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Ukladám...' : 'Uložiť'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
