import { Project } from '../../types/project.types';
import { DeleteProject } from './dialogs/delete-project';
import { EditProject } from './dialogs/edit-project';

interface ActionsProps {
    project: Project;
}

export const Actions = ({ project }: ActionsProps) => {
    return (
        <div className="flex items-center gap-2">
            <EditProject project={project} />
            <DeleteProject project={project} />
        </div>
    );
};
