import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CreateProjectDialog } from './dialogs/create-project';

interface ProjectsHeaderProps {
    exportCount: number;
    onExportProjects: () => void;
}

export const ProjectsHeader = ({
    exportCount,
    onExportProjects,
}: ProjectsHeaderProps) => {
    const { props } = usePage<SharedData>();
    const permissions =
        (props.current_user_permissions as string[] | undefined) ?? [];
    const isAdmin = Boolean(props.auth.user?.is_admin);
    const canCreateProject = isAdmin || permissions.includes('projects.create');
    const [createProjectOpen, setCreateProjectOpen] = useState(false);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get('action') !== 'create-project') {
            return;
        }

        if (canCreateProject) {
            setCreateProjectOpen(true);
        }

        url.searchParams.delete('action');
        window.history.replaceState(
            null,
            '',
            `${url.pathname}${url.search}${url.hash}`,
        );
    }, [canCreateProject]);

    return (
        <div className="page-head mb-6">
            <div>
                <h1 className="page-head__title">Projekty</h1>
                <p className="page-head__subtitle">
                    Prehľad všetkých interných a klientskych projektov, ich
                    stav, vyťaženie tímov a deadlineov.
                </p>
            </div>
            <div className="page-head__actions">
                <button
                    type="button"
                    className="btn"
                    onClick={onExportProjects}
                    disabled={exportCount === 0}
                    title={
                        exportCount > 0
                            ? `Exportovať ${exportCount} projektov do CSV`
                            : 'Nie je čo exportovať'
                    }
                >
                    <Download className="h-4 w-4" />
                    Export
                </button>
                {canCreateProject && (
                    <CreateProjectDialog
                        open={createProjectOpen}
                        onOpenChange={setCreateProjectOpen}
                    />
                )}
            </div>
        </div>
    );
};
