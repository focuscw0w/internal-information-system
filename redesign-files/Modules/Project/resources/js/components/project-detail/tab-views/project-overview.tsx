import { AlertTriangle, Calendar, Clock, TrendingUp } from 'lucide-react';
import { Project } from '../../../types/types';
import { StatCard } from '../../ui/statcard';
import { TaskTable } from '../task-table/task-table';

interface ProjectOverviewProps {
    project: Project;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

    const capacityPercentage = Math.min(project.capacity_used, 100);

    const atRiskTaskCount = project.tasks?.filter((t) => t.is_at_risk && t.status !== 'done').length ?? 0;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Obdobie projektu"
                    value={new Date(project.start_date).toLocaleDateString('sk-SK')}
                    subtitle={`až ${new Date(project.end_date).toLocaleDateString('sk-SK')}`}
                    icon={Calendar}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-50"
                />

                <StatCard
                    title="Kapacita"
                    value={`${project.capacity_used}%`}
                    subtitle={`${project.capacity_available}% voľných`}
                    icon={Clock}
                    iconColor="text-amber-600"
                    iconBgColor="bg-amber-50"
                    progress={capacityPercentage}
                    progressLabel={`${project.capacity_used}% použité`}
                />

                <StatCard
                    title="Progres"
                    value={`${project.progress}%`}
                    subtitle={`${project.tasks_completed} z ${project.tasks_total} úloh`}
                    icon={TrendingUp}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-50"
                    progress={project.progress}
                />

                <StatCard
                    title="Ohrozené úlohy"
                    value={String(atRiskTaskCount)}
                    subtitle={atRiskTaskCount > 0 ? 'úlohy vyžadujú pozornosť' : 'žiadne problémy'}
                    icon={AlertTriangle}
                    iconColor={atRiskTaskCount > 0 ? 'text-red-600' : 'text-gray-400'}
                    iconBgColor={atRiskTaskCount > 0 ? 'bg-red-50' : 'bg-gray-50'}
                />
            </div>

            {can('view_tasks') && <TaskTable project={project} />}
        </div>
    );
}
