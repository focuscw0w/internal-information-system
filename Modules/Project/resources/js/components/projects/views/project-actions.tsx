import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Project } from '../../../types/types';
import { DeleteProjectDialog } from '../dialogs/delete-project';
import { EditProjectDialog } from '../dialogs/edit-project';

interface ProjectActionsProps {
    project: Project;
}

export const ProjectActions = ({ project }: ProjectActionsProps) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                className="icon-btn"
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen((current) => !current);
                }}
                title="Akcie projektu"
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>
            {open && (
                <div
                    className="absolute top-9 right-0 z-30 w-40 rounded-lg border border-border bg-card p-1 shadow-md"
                    onMouseLeave={() => setOpen(false)}
                    onClick={(event) => event.stopPropagation()}
                >
                    <EditProjectDialog project={project} text="Upraviť" />
                    <DeleteProjectDialog project={project} text="Zmazať" />
                </div>
            )}
        </div>
    );
};
