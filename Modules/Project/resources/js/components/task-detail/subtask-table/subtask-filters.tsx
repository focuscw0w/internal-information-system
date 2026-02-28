import { Filter, X } from 'lucide-react';

export type CompletionFilter = 'all' | 'completed' | 'incomplete';

interface SubtaskFiltersProps {
    completionFilter: CompletionFilter;
    filteredCount: number;
    totalCount: number;
    onChange: (value: CompletionFilter) => void;
}

export const SubtaskFilters = ({
                                   completionFilter,
                                   filteredCount,
                                   totalCount,
                                   onChange,
                               }: SubtaskFiltersProps) => {
    return (
        <div className="flex items-center gap-2 pt-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
                value={completionFilter}
                onChange={(e) => onChange(e.target.value as CompletionFilter)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                <option value="all">Všetky</option>
                <option value="incomplete">Nedokončené</option>
                <option value="completed">Hotové</option>
            </select>

            {completionFilter !== 'all' && (
                <>
                    <button
                        onClick={() => onChange('all')}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="h-3 w-3" />
                        Zrušiť filtre
                    </button>
                    <span className="text-xs text-gray-400">
                        {filteredCount} z {totalCount}
                    </span>
                </>
            )}
        </div>
    );
};
