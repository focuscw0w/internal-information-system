import { Project } from '../../types/types';
import { DeleteProjectDialog } from './dialogs/delete-project';
import { EditProjectDialog } from './dialogs/edit-project';

interface ProjectActionsProps {
    project: Project;
}

export const ProjectActions = ({ project }: ProjectActionsProps) => {
    return (
        <div className="flex items-center gap-2">
            <EditProjectDialog project={project} />
            <DeleteProjectDialog project={project} />
        </div>
    );
};
