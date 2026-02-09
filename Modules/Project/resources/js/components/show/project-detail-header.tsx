import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';
import { Project } from '../../types/project.types';
import { ProjectBadge } from '../project-badge';

interface ProjectDetailHeaderProps {
    project: Project;
}

export const ProjectDetailHeader = ({ project }: ProjectDetailHeaderProps) => {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <Link
                href="/project"
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
                    <ProjectBadge
                        type="status"
                        value={project.status}
                        className="hidden sm:block"
                    />
                    <ProjectBadge
                        type="workload"
                        value={project.workload}
                        className="hidden sm:block"
                    />

                    {/* TODO: vytvoriť dialog na edit */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 p-4"
                        onClick={() =>
                            router.visit(`/projects/${project.id}/edit`)
                        }
                    >
                        <Edit className="mr-2 h-5 w-5" />
                        Upraviť
                    </Button>
                </div>
            </div>
        </div>
    );
};
