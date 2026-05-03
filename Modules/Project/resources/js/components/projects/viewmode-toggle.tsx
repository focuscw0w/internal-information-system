import { Grid3x3, List } from 'lucide-react';
import { ViewMode } from '../../types/types';

interface ViewModeToggleProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({
    viewMode,
    onViewModeChange,
}: ViewModeToggleProps) => {
    return (
        <div className="seg" aria-label="Prepnúť zobrazenie projektov">
            <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`seg__btn ${viewMode === 'grid' ? 'is-active' : ''}`}
            >
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
            </button>
            <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`seg__btn ${viewMode === 'list' ? 'is-active' : ''}`}
            >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Zoznam</span>
            </button>
        </div>
    );
};
