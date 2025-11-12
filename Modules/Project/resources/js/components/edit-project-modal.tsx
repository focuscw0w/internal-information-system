import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import EditProjectForm from '../components/edit-project-form';
import { Pencil } from 'lucide-react';

export default function EditProjectModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Upraviť projekt</DialogTitle>
                </DialogHeader>
                <EditProjectForm />
            </DialogContent>
        </Dialog>
    );
}
