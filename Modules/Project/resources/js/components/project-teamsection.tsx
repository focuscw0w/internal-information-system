import { TeamMember } from '../types/project.types';
import { TeamMemberCard } from './project-teammember-card';

interface ProjectTeamSectionProps {
    team: TeamMember[];
}

export const ProjectTeamSection = ({
    team,
}: ProjectTeamSectionProps) => {
    return (
        <div className="border-t border-gray-200 pt-4">
            <h4 className="mb-3 font-semibold text-gray-900">Tím projektu</h4>
            <div className="space-y-2">
                {team.map((member, idx) => (
                    <TeamMemberCard key={idx} member={member} />
                ))}
            </div>
        </div>
    );
};
