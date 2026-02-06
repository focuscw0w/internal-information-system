import { Grid3x3, List } from 'lucide-react';
import React from 'react';
import { ViewMode } from '../types/project.types';
import { Button } from '@/components/ui/button';

interface ViewModeToggleProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({
    viewMode,
    onViewModeChange,
}: ViewModeToggleProps) => {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow">
            <Button
                onClick={() => onViewModeChange('grid')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${
                    viewMode === 'grid'
                        ? 'text-white bg-primary'
                        : 'text-black bg-secondary hover:bg-gray-100'
                }`}
            >
                <Grid3x3 size={18} />
                <span className="font-medium">Grid</span>
            </Button>
            <Button
                onClick={() => onViewModeChange('list')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${
                    viewMode === 'list'
                        ? 'text-white bg-primary'
                        : 'text-black bg-secondary hover:bg-gray-100'
                }`}
            >
                <List size={18} />
                <span className="font-medium">Zoznam</span>
            </Button>
        </div>
    );
};
