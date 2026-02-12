import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Project } from '../../types/types';
import { EditProjectDialog } from '../index/dialogs/edit-project';
import { BadgeLabel } from '../ui/badge';

interface ShowHeaderProps {
    project: Project;
}

export const ShowHeader = ({ project }: ShowHeaderProps) => {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <Link
                href="/projects"
                className="mb-4 inline-flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
                <ArrowLeft className="mr-1 h-5 w-5" />
                Späť na projekty
            </Link>

            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {project.name}
                    </h1>
                    {project.description && (
                        <p className="mt-2 max-w-2xl text-gray-600">
                            {project.description}
                        </p>
                    )}
                </div>
                <div className="ml-4 flex flex-shrink-0 gap-2">
                    <BadgeLabel
                        type="status"
                        value={project.status}
                        className="hidden sm:flex items-center justify-center"
                    />
                    <BadgeLabel
                        type="workload"
                        value={project.workload}
                        className="hidden sm:flex items-center justify-center"
                    />

                    <EditProjectDialog
                        project={project}
                        text="Upraviť projekt"
                    />
                </div>
            </div>
        </div>
    );
};
