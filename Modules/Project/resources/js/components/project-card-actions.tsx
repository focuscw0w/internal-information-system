import { Edit, Trash2 } from 'lucide-react';
import React from 'react';

interface ProjectCardActionsProps {
    projectId: number;
    onEdit: (projectId: number) => void;
    onDelete: (projectId: number) => void;
}

export const ProjectCardActions: React.FC<ProjectCardActionsProps> = ({
    projectId,
    onEdit,
    onDelete,
}) => {
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        onEdit(projectId);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(projectId);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleEdit}
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                title="Upraviť projekt"
            >
                <Edit size={18} />
            </button>
            <button
                onClick={handleDelete}
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Zmazať projekt"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};
