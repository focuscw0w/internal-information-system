import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from '@/components/ui/dialog';
import AddProjectForm from '@/features/projects/components/add-project-form';

export default function AddProjectModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex items-center justify-start bg-muted/40 p-4">
                    <Button type="button">Pridať nový projekt</Button>
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="px-6 py-4"></DialogHeader>
                <AddProjectForm />
            </DialogContent>
        </Dialog>
    );
}
