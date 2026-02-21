import { Users } from 'lucide-react';

export const EmptyTeamState = () => {
    return (
        <div className="rounded-lg border border-dashed p-8 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">Žiadni členovia</p>
            <p className="text-xs text-gray-500">
                Použite formulár vyššie pre pridanie členov tímu
            </p>
        </div>
    );
};
