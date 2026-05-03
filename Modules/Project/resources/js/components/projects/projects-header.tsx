import { ViewMode } from '../../types/types';
import { CreateProjectDialog } from './dialogs/create-project';
import { ViewModeToggle } from './viewmode-toggle';

interface ProjectsHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const ProjectsHeader = ({
    viewMode,
    onViewModeChange,
}: ProjectsHeaderProps) => {
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
                <button type="button" className="btn">
                    Export
                </button>
                <CreateProjectDialog />
                <ViewModeToggle
                    viewMode={viewMode}
                    onViewModeChange={onViewModeChange}
                />
            </div>
        </div>
    );
};
