import { AlertCircle, Users } from 'lucide-react';
import React from 'react';
import { Project } from '../types/project.types';
import {
    getCapacityColor,
    getStatusColor,
    getStatusText,
    getWorkloadColor,
} from '../utils/project.utils';
import { ProjectCardActions } from './project-card-actions';

interface ProjectRowProps {
    project: Project;
    onClick: (projectId: number) => void;
}

export const ProjectRow = ({
    project,
    onClick,
}: ProjectRowProps) => {
    return (
        <div
            className="group mb-4 cursor-pointer rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
            onClick={() => onClick(project.id)}
        >
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
                    <div className="flex-1 hidden lg:block">
                        <div className="mb-2 flex lg:justify-between text-sm text-gray-600">
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
                    <div className="flex-1 hidden lg:block">
                        <div className="mb-2 flex lg:justify-between text-sm text-gray-600">
                            <span>Kapacita</span>
                            <span className="font-medium">
                                {project.capacityUsed}%
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className={`h-2 rounded-full ${getCapacityColor(project.capacityUsed)}`}
                                style={{ width: `${project.capacityUsed}%` }}
                            />
                        </div>
                    </div>

                    {/* Úlohy */}
                    <div className="text-center hidden sm:block">
                        <p className="mb-1 text-sm text-gray-600">Úlohy</p>
                        <p className="text-xl font-bold text-gray-900">
                            {project.tasksCompleted}/{project.tasksTotal}
                        </p>
                    </div>

                    {/* Tím */}
                    <div className="text-center hidden sm:block">
                        <p className="mb-1 text-sm text-gray-600">Tím</p>
                        <div className="flex items-center justify-center gap-1 text-gray-900">
                            <Users size={18} />
                            <span className="font-semibold">
                                {project.teamSize}
                            </span>
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
                        <ProjectCardActions
                            project={project}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
