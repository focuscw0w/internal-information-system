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
    const { data, setData, post, processing, errors, reset } =
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

        post("/projects", {
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
                            placeholder="e.g. Marketing Website Redesign"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="client">Klient</Label>
                        <Input id="client" placeholder="ACME s.r.o." />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Popis</Label>
                    <Textarea
                        id="description"
                        placeholder="Krátky popis projektu a jeho cieľov..."
                        className="min-h-[120px]"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select defaultValue="planned">
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
                    </div>

                    <div className="space-y-2">
                        <Label>Priorita</Label>
                        <Select defaultValue="medium">
                            <SelectTrigger>
                                <SelectValue placeholder="Vyber prioritu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="start_date">Od</Label>
                        <Input id="start_date" type="date" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Do</Label>
                        <Input id="due_date" type="date" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tags">Pomocné tagy</Label>
                    <Input id="tags" placeholder="design, web, q4" />
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="ghost">
                        Resetovať
                    </Button>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline">
                            Zrušiť
                        </Button>
                        <Button type="button">Vytvoriť projekt</Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
