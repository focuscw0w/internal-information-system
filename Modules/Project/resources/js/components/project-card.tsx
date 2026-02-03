import React from 'react';
import { Project } from '../types/project.types';
import { ProjectHeader } from './project-header';
import { ProjectMetrics } from './project-metrics';
import { ProjectCardActions } from './project-card-actions';
import { ProgressBar } from './project-progressbar';
import { getCapacityColor } from '../utils/project.utils';

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: number) => void;
  onEdit: (projectId: number) => void;
  onDelete: (projectId: number) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick,
  onEdit,
  onDelete
}) => {
  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer relative group"
      onClick={() => onClick(project.id)}
    >
      {/* Akčné tlačidlá - zobrazujú sa pri hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ProjectCardActions 
          projectId={project.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <div className="p-6 border-b border-gray-200">
        <ProjectHeader 
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

        <ProjectMetrics 
          startDate={project.startDate}
          endDate={project.endDate}
          teamSize={project.teamSize}
        />
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Využitie kapacity</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900">{project.capacityUsed}%</span>
              <span className="text-sm text-gray-500 mb-1">použité</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getCapacityColor(project.capacityUsed)}`}
                style={{ width: `${project.capacityUsed}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Úlohy</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900">{project.tasksCompleted}</span>
              <span className="text-sm text-gray-500 mb-1">/ {project.tasksTotal}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(project.tasksCompleted / project.tasksTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};