import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Project,
    ProjectStatus,
    ViewMode,
    WorkloadLevel,
} from '../../types/types';
import { ProjectsHeader } from './projects-header';
import { ViewModeToggle } from './viewmode-toggle';
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
    { value: 'end_date', label: 'Zoradiť: Najbližší deadline' },
    { value: 'progress_desc', label: 'Najvyšší pokrok' },
    { value: 'status', label: 'Stav' },
    { value: 'name', label: 'Názov (A-Z)' },
];

interface ProjectsOverviewProps {
    projects: Project[];
}

const csvHeaders = [
    'Názov',
    'Vedúci projektu',
    'Stav',
    'Vyťaženie',
    'Začiatok',
    'Koniec',
    'Pokrok (%)',
    'Kapacita (%)',
    'Dokončené úlohy',
    'Úlohy celkom',
    'Členovia tímu',
    'Dní do deadline',
    'Detail',
];

const csvValue = (value: string | number | null | undefined): string => {
    const text = value === null || value === undefined ? '' : String(value);

    return `"${text.replace(/"/g, '""')}"`;
};

const projectToCsvRow = (project: Project): Array<string | number> => [
    project.name,
    project.owner?.name ?? '',
    project.status,
    project.workload,
    project.start_date,
    project.end_date,
    project.progress,
    project.capacity_used,
    project.tasks_completed,
    project.tasks_total,
    project.team_size,
    project.days_remaining,
    `${window.location.origin}/projects/${project.id}`,
];

const canExportProject = (project: Project): boolean =>
    project.current_user_permissions.includes('export_data');

const downloadCsv = (projects: Project[]): void => {
    const rows = [
        csvHeaders,
        ...projects.map((project) => projectToCsvRow(project)),
    ];
    const csv = rows
        .map((row) => row.map((value) => csvValue(value)).join(','))
        .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `projekty-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const ProjectsOverview = ({ projects }: ProjectsOverviewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(
        null,
    );
    const [workloadFilter, setWorkloadFilter] = useState<WorkloadLevel | null>(
        null,
    );
    const [sortBy, setSortBy] = useState<SortOption>('end_date');

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
    const exportableProjects = filtered.filter(canExportProject);

    return (
        <div>
            <ProjectsHeader
                exportCount={exportableProjects.length}
                canExportProjects={exportableProjects.length > 0}
                onExportProjects={() => downloadCsv(exportableProjects)}
            />

            <div className="kpi-grid mb-6">
                <div className="kpi">
                    <span className="kpi__label">Aktívne projekty</span>
                    <span className="kpi__value">
                        {activeProjects}
                        <sub>/ {projects.length}</sub>
                    </span>
                    <span className="kpi__delta kpi__delta--up">
                        ↗ +1 oproti minulému mesiacu
                    </span>
                </div>
                <div className="kpi">
                    <span className="kpi__label">Ľudia v projektoch</span>
                    <span className="kpi__value">{totalTeam}</span>
                    <span className="kpi__delta">naprieč 4 tímami</span>
                </div>
                <div className="kpi">
                    <span className="kpi__label">Priemerné vyťaženie</span>
                    <span className="kpi__value">
                        {avgCapacity}
                        <sub>%</sub>
                    </span>
                    <span className="kpi__delta kpi__delta--down">
                        ↑ 8% — pozri kapacity
                    </span>
                </div>
                <div className="kpi">
                    <span className="kpi__label">Dokončené úlohy</span>
                    <span className="kpi__value">
                        {tasksCompleted}
                        <sub>/ {tasksTotal}</sub>
                    </span>
                    <div className="progress mt-3">
                        <div
                            className="progress__fill"
                            style={{
                                width: `${tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0}%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="command-bar mb-4">
                <div className="field-wrap command-bar__search">
                    <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Hľadať projekt podľa názvu alebo klienta..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input--with-icon w-full"
                    />
                </div>

                <div className="command-bar__filters">
                    <select
                        value={statusFilter ?? ''}
                        onChange={(e) =>
                            setStatusFilter(
                                (e.target.value as ProjectStatus) || null,
                            )
                        }
                        className="select text-xs"
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
                        className="select text-xs"
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
                        className="select text-xs"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="command-bar__spacer" />
                <span className="text-xs text-muted-foreground">
                    {filtered.length} z {projects.length}
                </span>
                <ViewModeToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {hasFilters && (
                    <div className="command-bar__actions">
                        <button
                            onClick={clearFilters}
                            className="btn btn--ghost btn--sm"
                        >
                            <X className="h-3 w-3" />
                            Zrušiť filtre
                        </button>
                    </div>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                    <Search className="h-10 w-10 text-gray-300" />
                    <p className="text-sm">
                        Žiadne projekty nezodpovedajú filtrom
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-xs text-primary hover:underline"
                    >
                        Zrušiť filtre
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((project) => (
                        <Card
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
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
