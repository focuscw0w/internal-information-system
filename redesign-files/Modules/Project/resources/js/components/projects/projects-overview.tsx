import { router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Filter,
    Search,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Project,
    ProjectStatus,
    ViewMode,
    WorkloadLevel,
} from '../../types/types';
import { StatCard } from '../ui/statcard';
import { ProjectsHeader } from './projects-header';
import { Card } from './views/card';
import { Row } from './views/row';

type SortOption = 'name' | 'end_date' | 'progress_desc' | 'status';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'active', label: 'Aktívny' },
    { value: 'planning', label: 'Plánovanie' },
    { value: 'on_hold', label: 'Pozastavený' },
    { value: 'completed', label: 'Dokončený' },
    { value: 'cancelled', label: 'Zrušený' },
];

const WORKLOAD_OPTIONS: { value: WorkloadLevel; label: string }[] = [
    { value: 'low', label: 'Nízke' },
    { value: 'medium', label: 'Stredné' },
    { value: 'high', label: 'Vysoké' },
    { value: 'overloaded', label: 'Preťažené' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'name', label: 'Názov (A–Z)' },
    { value: 'end_date', label: 'Najbližší deadline' },
    { value: 'progress_desc', label: 'Najvyšší pokrok' },
    { value: 'status', label: 'Stav' },
];

interface ProjectsOverviewProps {
    projects: Project[];
}

export const ProjectsOverview = ({ projects }: ProjectsOverviewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(
        null,
    );
    const [workloadFilter, setWorkloadFilter] = useState<WorkloadLevel | null>(
        null,
    );
    const [sortBy, setSortBy] = useState<SortOption>('name');

    const handleProjectClick = (projectId: number) => {
        router.visit(`/projects/${projectId}`);
    };

    const hasFilters = Boolean(search || statusFilter || workloadFilter);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter(null);
        setWorkloadFilter(null);
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return projects
            .filter((p) => {
                if (q && !p.name.toLowerCase().includes(q)) return false;
                if (statusFilter && p.status !== statusFilter) return false;
                if (workloadFilter && p.workload !== workloadFilter)
                    return false;
                return true;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'end_date':
                        return (
                            new Date(a.end_date).getTime() -
                            new Date(b.end_date).getTime()
                        );
                    case 'progress_desc':
                        return b.progress - a.progress;
                    case 'status':
                        return a.status.localeCompare(b.status);
                    default:
                        return a.name.localeCompare(b.name, 'sk');
                }
            });
    }, [projects, search, statusFilter, workloadFilter, sortBy]);

    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const totalTeam = projects.reduce((sum, p) => sum + p.team_size, 0);
    const avgCapacity =
        projects.length > 0
            ? Math.round(
                  projects.reduce((sum, p) => sum + p.capacity_used, 0) /
                      projects.length,
              )
            : 0;
    const tasksCompleted = projects.reduce(
        (sum, p) => sum + p.tasks_completed,
        0,
    );
    const tasksTotal = projects.reduce((sum, p) => sum + p.tasks_total, 0);

    return (
        <div className="min-h-screen">
            {/* Header */}
            <ProjectsHeader
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Súhrnné štatistiky */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Aktívne projekty"
                    value={activeProjects}
                    icon={TrendingUp}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="Celkový tím"
                    value={totalTeam}
                    icon={Users}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Priemerné vyťaženie"
                    value={`${avgCapacity}%`}
                    icon={Clock}
                    iconColor="text-yellow-600"
                    iconBgColor="bg-yellow-100"
                />
                <StatCard
                    title="Dokončené úlohy"
                    value={`${tasksCompleted}/${tasksTotal}`}
                    icon={CheckCircle2}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

            {/* Filter bar */}
            <div className="mb-5 flex flex-wrap items-center gap-6">
                <div className="relative w-125">
                    <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Hľadať projekt..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white py-1.5 pr-3 pl-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <Filter className="h-4 w-4 flex-shrink-0 text-gray-400" />

                    <select
                        value={statusFilter ?? ''}
                        onChange={(e) =>
                            setStatusFilter(
                                (e.target.value as ProjectStatus) || null,
                            )
                        }
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">Všetky stavy</option>
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={workloadFilter ?? ''}
                        onChange={(e) =>
                            setWorkloadFilter(
                                (e.target.value as WorkloadLevel) || null,
                            )
                        }
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">Všetky zaťaženia</option>
                        {WORKLOAD_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) =>
                            setSortBy(e.target.value as SortOption)
                        }
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                {hasFilters && (
                    <>
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                            <X className="h-3 w-3" />
                            Zrušiť filtre
                        </button>
                        <span className="text-xs text-gray-400">
                            {filtered.length} z {projects.length}
                        </span>
                    </>
                )}
            </div>

            {/* Grid alebo List view */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                    <Search className="h-10 w-10 text-gray-300" />
                    <p className="text-sm">
                        Žiadne projekty nezodpovedajú filtrom
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-xs text-blue-500 hover:underline"
                    >
                        Zrušiť filtre
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {filtered.map((project) => (
                        <Card
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project.id)}
                        />
                    ))}
                </div>
            ) : (
                <div>
                    {filtered.map((project) => (
                        <Row
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
