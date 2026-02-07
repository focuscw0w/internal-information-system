import { AlertCircle, Users } from 'lucide-react';
import { Project } from '../../types/project.types';
import {
    getCapacityColor,
    getStatusColor,
    getStatusText,
    getWorkloadColor,
} from '../../utils/project.utils';
import { ProjectCardActions } from '../project-card-actions';

interface ProjectRowProps {
    project: Project;
}

export const ProjectRow = ({ project }: ProjectRowProps) => {
    return (
        <div className="group mb-4 cursor-pointer rounded-lg bg-white shadow transition-shadow hover:shadow-lg">
            <div className="p-6">
                <div className="flex items-center justify-between gap-6">
                    {/* Názov a status */}
                    <div className="min-w-0 lg:flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                            {project.name}
                        </h3>
                        <span
                            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(project.status)}`}
                        >
                            {getStatusText(project.status)}
                        </span>
                    </div>

                    {/* Progres */}
                    <div className="hidden flex-1 lg:block">
                        <div className="mb-2 flex text-sm text-gray-600 lg:justify-between">
                            <span>Progres</span>
                            <span className="font-medium">
                                {project.progress}%
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Kapacita */}
                    <div className="hidden flex-1 lg:block">
                        <div className="mb-2 flex text-sm text-gray-600 lg:justify-between">
                            <span>Kapacita</span>
                            <span className="font-medium">
                                {project.capacity_used}%
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className={`h-2 rounded-full ${getCapacityColor(project.capacity_used)}`}
                                style={{ width: `${project.capacity_used}%` }}
                            />
                        </div>
                    </div>

                    {/* Úlohy */}
                    <div className="hidden text-center sm:block">
                        <p className="mb-1 text-sm text-gray-600">Úlohy</p>
                        <p className="text-xl font-bold text-gray-900">
                            {project.tasks_completed}/{project.tasks_total}
                        </p>
                    </div>

                    {/* Tím */}
                    <div className="hidden text-center sm:block">
                        <p className="mb-1 text-sm text-gray-600">Tím</p>
                        <div className="flex items-center justify-center gap-1 text-gray-900">
                            <Users size={18} />
                            <span className="font-semibold">0</span>
                        </div>
                    </div>

                    {/* Zaťaženie */}
                    <div className="w-24 text-center">
                        <p className="mb-1 text-sm text-gray-600">Zaťaženie</p>
                        <div
                            className={`flex items-center justify-center gap-1 ${getWorkloadColor(project.workload)}`}
                        >
                            <AlertCircle size={18} />
                            <span className="text-sm font-medium capitalize">
                                {project.workload}
                            </span>
                        </div>
                    </div>

                    {/* Akcie - vždy viditeľné v liste */}
                    <div className="w-24">
                        <ProjectCardActions project={project} />
                    </div>
                </div>
            </div>
        </div>
    );
};
