import React from 'react';
import { TeamMember } from '../types/project.types';

interface TeamMemberCardProps {
  member: TeamMember;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{member.name}</p>
        <p className="text-sm text-gray-500">{member.role}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{member.allocation}%</p>
        <p className="text-xs text-gray-500">alokácia</p>
      </div>
    </div>
  );
};