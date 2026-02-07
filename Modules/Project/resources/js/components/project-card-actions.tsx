import { Project } from '../types/project.types';
import { ProjectDeleteDialog } from './index/project-delete-dialog';
import { ProjectEditForm } from './project-edit-form';

interface ProjectCardActionsProps {
    project: Project;
}

export const ProjectCardActions = ({ project }: ProjectCardActionsProps) => {
    return (
        <div className="flex items-center gap-2">
            <ProjectEditForm project={project} />
            <ProjectDeleteDialog project={project} />
        </div>
    );
};
