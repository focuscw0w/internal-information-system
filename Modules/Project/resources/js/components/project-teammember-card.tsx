import { TeamMember } from '../types/types';

interface TeamMemberCardProps {
    member: TeamMember;
}

export const TeamMemberCard = ({ member }: TeamMemberCardProps) => {
    return (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">
                    {member.permissions.join(', ')}
                </p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-900">
                    {member.allocation}%
                </p>
                <p className="text-xs text-gray-500">alokácia</p>
            </div>
        </div>
    );
};
