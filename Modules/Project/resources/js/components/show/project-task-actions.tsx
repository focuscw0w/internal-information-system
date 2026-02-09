import { Task } from '../../types/project.types';
import { ProjectTaskDeleteDialog } from './project-delete-task-dialog';
import { ProjectTaskEditDialog } from './project-edit-task-dialog';

interface ProjectTaskListActionsProps {
    task: Task;
    projectId: number;
    team: any[];
}

export const ProjectTaskListActions = ({
    task,
    projectId,
    team,
}: ProjectTaskListActionsProps) => {
    return (
        <div className="flex items-center gap-1">
            <ProjectTaskEditDialog task={task} projectId={projectId} team={team} />
            <ProjectTaskDeleteDialog task={task} projectId={projectId} />
        </div>
    );
};
