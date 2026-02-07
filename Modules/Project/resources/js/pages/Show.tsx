import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/project-statcard';
import { ProjectAllocations } from '../components/show/project-allocations';
import { ProjectDetailHeader } from '../components/show/project-detail-header';
import { ProjectTaskList } from '../components/show/project-task-list';
import { Project } from '../types/project.types';

export default function Show({ project }: { project: Project }) {
    const budgetSpent = project.budget_spent ?? 0;
    const budget = project.budget ?? 0;

    const budgetPercentage = budget > 0 ? (budgetSpent / budget) * 100 : 0;
    const capacityPercentage =
        project.capacity_available > 0
            ? (project.capacity_used / project.capacity_available) * 100
            : 0;

    return (
        <AppLayout>
            <Head title={`Detail projektu - ${project.name}`} />

            <div className="min-h-screen space-y-6 p-6">
                {/* Header */}
                <ProjectDetailHeader project={project} />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Obdobie projektu"
                        value={new Date(project.start_date).toLocaleDateString(
                            'sk-SK',
                        )}
                        subtitle={`až ${new Date(project.end_date).toLocaleDateString('sk-SK')}`}
                        icon={Calendar}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-50"
                    />

                    <StatCard
                        title="Rozpočet"
                        value={`${budgetSpent.toFixed(2)}€`}
                        subtitle={`z ${budget.toFixed(2)}€`}
                        icon={DollarSign}
                        iconColor="text-emerald-600"
                        iconBgColor="bg-emerald-50"
                        progress={budgetPercentage}
                        progressLabel={`${budgetPercentage.toFixed(0)}% vyčerpané`}
                    />

                    <StatCard
                        title="Kapacita"
                        value={`${project.capacity_used}h`}
                        subtitle={`z ${project.capacity_available}h`}
                        icon={Clock}
                        iconColor="text-amber-600"
                        iconBgColor="bg-amber-50"
                        progress={capacityPercentage}
                        progressLabel={`${capacityPercentage.toFixed(0)}% použité`}
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
                </div>

                {/* Team Allocations */}
                <ProjectAllocations project={project} />

                {/* Tasks List */}
                <ProjectTaskList project={project} />
            </div>
        </AppLayout>
    );
}
