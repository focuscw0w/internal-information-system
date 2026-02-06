import { Trash2 } from 'lucide-react';
import { Project } from '../types/project.types';
import { ProjectEditForm } from './project-edit-form';

interface ProjectCardActionsProps {
    project: Project;
}

export const ProjectCardActions = ({ project }: ProjectCardActionsProps) => {
    return (
        <>
            <div className="flex items-center gap-2">
                <ProjectEditForm project={project} />
                <button
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Zmazať projekt"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </>
    );
};
