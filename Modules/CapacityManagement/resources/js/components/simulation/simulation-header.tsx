import { Link } from '@inertiajs/react';

type SimulationHeaderProps = {
    projectName: string;
};

export function SimulationHeader({ projectName }: SimulationHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">{projectName}</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Posuňte parametre a uvidíte dočasný prepočet dokončenia.
                    Simulácia nemení deadline, tím ani úlohy projektu.
                </p>
            </div>
            <Link
                href="/capacity-management"
                className="px-3 py-1.5 text-sm text-gray-600"
            >
                ← Späť na Dashboard
            </Link>
        </div>
    );
}
