import { Download } from 'lucide-react';
import { CreateProjectDialog } from './dialogs/create-project';

export const ProjectsHeader = () => {
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
                    <Download className="h-4 w-4" />
                    Export
                </button>
                <CreateProjectDialog />
            </div>
        </div>
    );
};
