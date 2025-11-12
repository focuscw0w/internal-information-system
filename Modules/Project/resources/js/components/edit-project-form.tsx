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

export default function EditProjectForm() {
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Názov projektu</Label>
                    <Input
                        id="name"
                        defaultValue="Marketing Website Redesign"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="client">Klient</Label>
                    <Input id="client" defaultValue="ACME s.r.o." />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Popis</Label>
                <Textarea
                    id="description"
                    className="min-h-[120px]"
                    defaultValue="Redizajn firemného webu, doručenie do konca Q1, zameranie na výkon a SEO."
                />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select defaultValue="active">
                        <SelectTrigger>
                            <SelectValue placeholder="Vyber status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
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

                <div className="space-y-2">
                    <Label htmlFor="tags">Tagy</Label>
                    <Input id="tags" defaultValue="design, web, q1" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="from">Od</Label>
                    <Input id="from" type="date" defaultValue="2025-01-12" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="to">Do</Label>
                    <Input id="to" type="date" defaultValue="2025-03-30" />
                </div>
            </div>

            <Separator />

            <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline">
                    Zrušiť
                </Button>
                <Button type="button">Uložiť</Button>
            </div>
        </div>
    );
}
