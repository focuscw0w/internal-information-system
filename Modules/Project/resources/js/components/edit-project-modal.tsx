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
import { Project } from '../types/Project';

interface ModalProps {
    project: Project
}

export default function EditProjectModal({project}: ModalProps) {
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
                <EditProjectForm project={project} />
            </DialogContent>
        </Dialog>
    );
}
