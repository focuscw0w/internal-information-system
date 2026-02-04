import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { ViewMode } from '../types/project.types';
import { ViewModeToggle } from './project-viewmode-toggle';

interface ProjectHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onCreateProject: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    viewMode,
    onViewModeChange,
    onCreateProject,
}) => {
    return (
        <div className="mb-8">
            <div className="items-center justify-between gap-4 md:flex lg:gap-0">
                <p className="mb-2 text-gray-600 md:mb-0">
                    Prehľad projektov, zdrojov a vyťaženia tímu
                </p>
                <div className="flex items-center gap-6">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default" size="lg">
                                Nový projekt
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Vytvoriť nový projekt</DialogTitle>
                                <DialogDescription>
                                    Zadajte základné informácie o projekte.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <p>Formulár na vytvorenie projektu...</p>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Zrušiť</Button>
                                </DialogClose>
                                <Button onClick={onCreateProject}>
                                    Vytvoriť projekt
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                    />
                </div>
            </div>
        </div>
    );
};
