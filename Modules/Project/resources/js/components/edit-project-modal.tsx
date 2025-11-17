import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import EditProjectForm from '../components/edit-project-form';
import { Project } from '../types/Project';

interface ModalProps {
    project: Project
    children: React.ReactNode
}

export default function EditProjectModal({project, children}: ModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
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
