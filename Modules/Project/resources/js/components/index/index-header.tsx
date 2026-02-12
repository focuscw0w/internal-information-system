import { ViewMode } from '../../types/types';
import { CreateProjectDialog } from './dialogs/create-project';
import { ViewModeToggle } from './viewmode-toggle';

interface IndexHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const IndexHeader = ({
    viewMode,
    onViewModeChange,
}: IndexHeaderProps) => {
    return (
        <div className="mb-8">
            <div className="items-center justify-between gap-4 md:flex lg:gap-0">
                <p className="mb-2 text-gray-600 md:mb-0">
                    Prehľad projektov, zdrojov a vyťaženia tímu
                </p>
                <div className="flex items-center gap-6">
                    <CreateProjectDialog />
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                    />
                </div>
            </div>
        </div>
    );
};
