import { Project } from '../../../types/project.types';
import { getCapacityColor } from '../../../utils/project.utils';
import { Actions } from '../actions';
import { Metrics } from '../metrics';
import { ProgressBar } from '../progressbar';
import { CardHeader } from './card-header';

interface CardProps {
    project: Project;
    onClick: () => void;
}

export const Card = ({ project, onClick }: CardProps) => {
    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 z-10 opacity-0 transition-opacity group-hover:opacity-100"
            >
                <Actions project={project} />
            </div>

            <div className="border-b border-gray-200 p-6">
                <CardHeader
                    name={project.name}
                    status={project.status}
                    workload={project.workload}
                />

                <div className="mb-4">
                    <ProgressBar
                        label="Progres"
                        value={project.progress}
                        color="bg-blue-600"
                    />
                </div>

                <Metrics
                    startDate={project.start_date}
                    endDate={project.end_date}
                    teamSize={project.team_size}
                />
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="mb-2 text-sm text-gray-600">
                            Využitie kapacity
                        </p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                {project.capacity_used}%
                            </span>
                            <span className="mb-1 text-sm text-gray-500">
                                použité
                            </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                                className={`h-2 rounded-full ${getCapacityColor(project.capacity_used)}`}
                                style={{ width: `${project.capacity_used}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-sm text-gray-600">Úlohy</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                {project.tasks_completed}
                            </span>
                            <span className="mb-1 text-sm text-gray-500">
                                / {project.tasks_total}
                            </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{
                                    width: `${(project.tasks_completed / project.tasks_total) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
