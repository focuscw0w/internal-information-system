import { Link } from '@inertiajs/react';

type SimulationHeaderProps = {
    projectName: string;
};

export function SimulationHeader({ projectName }: SimulationHeaderProps) {
    return (
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-2xl font-semibold">{projectName}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Posuňte slidre a okamžite uvidíte dopad na priebeh projektu.

                </p>
            </div>
            <Link
                href="/capacity-management"
                className="text-gray-60 px-3 py-1.5 text-sm"
            >
                ← Späť na Dashboard
            </Link>
        </div>
    );
}
