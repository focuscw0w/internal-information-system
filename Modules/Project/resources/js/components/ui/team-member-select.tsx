import { Label } from '@/components/ui/label';
import { User } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { TeamMember } from '../../types/types';

interface TeamMemberSelectProps {
    allUsers: User[] | TeamMember[];
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
    const membersWithCapacity = allUsers.filter(
        (user): user is TeamMember =>
            'weekly_utilization' in user ||
            'free_capacity_hours' in user ||
            'is_over_capacity' in user,
    );

    const selectedWarnings = membersWithCapacity.filter((user) => {
        if (!selectedMembers.includes(user.id)) {
            return false;
        }

        const utilization = user.weekly_utilization ?? 0;

        return utilization >= 80;
    });

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

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-300 bg-card p-3">
                {allUsers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                        Žiadni používatelia
                    </p>
                ) : (
                    allUsers.map((user) => {
                        const isSelected = selectedMembers.includes(user.id);
                        const utilization =
                            'weekly_utilization' in user &&
                            typeof user.weekly_utilization === 'number'
                                ? user.weekly_utilization
                                : null;
                        const isOverCapacity =
                            'is_over_capacity' in user &&
                            typeof user.is_over_capacity === 'boolean'
                                ? user.is_over_capacity
                                : false;
                        const isNearCapacity =
                            utilization !== null &&
                            utilization >= 80 &&
                            utilization <= 100;

                        return (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => toggleMember(user.id)}
                                className={`flex w-full cursor-pointer items-center gap-3 rounded-md p-2 transition-colors ${
                                    isSelected
                                        ? 'bg-primary text-primary-foreground'
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
                                                    ? 'text-primary-foreground/80'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            {user.email}
                                        </span>
                                    )}
                                    {isOverCapacity && (
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            Nad kapacitou
                                        </span>
                                    )}
                                    {!isOverCapacity && isNearCapacity && (
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}
                                        >
                                            Na hrane
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {selectedWarnings.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-medium">Kapacitné varovanie</p>
                            <p className="mt-1">
                                Vybraní ľudia sú už na hrane alebo nad
                                kapacitou. Priradenie ďalšej úlohy môže zvýšiť
                                riziko preťaženia.
                            </p>
                            <ul className="mt-2 list-inside list-disc text-xs">
                                {selectedWarnings.map((user) => (
                                    <li key={user.id}>
                                        {user.name}: voľné{' '}
                                        {user.free_capacity_hours ?? 0}h
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};
