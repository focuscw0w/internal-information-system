import { Label } from '@/components/ui/label';
import { User } from '@/types';

interface TeamMemberSelectProps {
    allUsers: User[];
    selectedMembers: number[];
    onChange: (members: number[]) => void;
    error?: string;
}

export const TeamMemberSelect = ({
    allUsers,
    selectedMembers,
    onChange,
    error,
}: TeamMemberSelectProps) => {
    const toggleMember = (userId: number) => {
        if (selectedMembers.includes(userId)) {
            onChange(selectedMembers.filter((id) => id !== userId));
        } else {
            onChange([...selectedMembers, userId]);
        }
    };

    return (
        <div className="grid gap-2">
            <Label>
                Členovia tímu
                {selectedMembers.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                        ({selectedMembers.length}{' '}
                        {selectedMembers.length === 1
                            ? 'člen'
                            : selectedMembers.length < 5
                              ? 'členovia'
                              : 'členov'}
                        )
                    </span>
                )}
            </Label>

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-300 bg-white p-3">
                {allUsers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                        Žiadni používatelia
                    </p>
                ) : (
                    allUsers.map((user) => {
                        const isSelected = selectedMembers.includes(user.id);

                        return (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => toggleMember(user.id)}
                                className={`flex w-full cursor-pointer items-center gap-3 rounded-md p-2 transition-colors ${
                                    isSelected
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex flex-1 items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {user.name}
                                    </span>
                                    {user.email && (
                                        <span
                                            className={`text-xs ${
                                                isSelected
                                                    ? 'text-blue-100'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            {user.email}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};
