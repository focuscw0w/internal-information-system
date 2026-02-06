import { ViewMode } from '../types/project.types';
import { CreateProjectForm } from './project-create-form';
import { ViewModeToggle } from './project-viewmode-toggle';

interface ProjectHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const ProjectHeader = ({
    viewMode,
    onViewModeChange,
}: ProjectHeaderProps) => {
    return (
        <div className="mb-8">
            <div className="items-center justify-between gap-4 md:flex lg:gap-0">
                <p className="mb-2 text-gray-600 md:mb-0">
                    Prehľad projektov, zdrojov a vyťaženia tímu
                </p>
                <div className="flex items-center gap-6">
                    <CreateProjectForm />
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                    />
                </div>
            </div>
        </div>
    );
};
