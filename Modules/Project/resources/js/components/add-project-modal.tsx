import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AddProjectForm } from '../components/add-project-form';
import { DialogTitle } from '../../../../../resources/js/components/ui/dialog';

export default function AddProjectModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex items-center justify-start bg-muted/40 p-4">
                    <Button type="button">Pridať nový projekt</Button>
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-4xl p-0">
                <DialogTitle></DialogTitle>
                <AddProjectForm />
            </DialogContent>
        </Dialog>
    );
}
