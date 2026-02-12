import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Crown, Users } from 'lucide-react';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '../../config';
import { Project } from '../../types/types';
import { EditProjectDialog } from '../index/dialogs/edit-project';
import { ManageTeamDialog } from './dialogs/manage-team';

interface TeamProps {
    project: Project;
}

export const Team = ({ project }: TeamProps) => {
    const owner = project.owner;
    const teamMembers = project.team || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Tím projektu
                        </h2>
                        <p className="text-sm text-gray-500">
                            {teamMembers.length + 1}{' '}
                            {teamMembers.length === 0
                                ? 'člen'
                                : teamMembers.length < 4
                                  ? 'členovia'
                                  : 'členov'}
                        </p>
                    </div>
                </div>
                <ManageTeamDialog project={project} />
            </div>

            {/* Owner Card */}
            {owner && (
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-semibold text-white">
                                {owner.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {owner.name}
                                    </h3>
                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                        <Crown className="mr-1 h-3 w-3" />
                                        Vlastník
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {owner.email}
                                </p>

                                <div className="mt-3">
                                    <p className="mb-2 text-xs font-medium text-gray-700">
                                        Oprávnenia:
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="text-xs text-gray-600"
                                    >
                                        <CheckCircle2 className="mr-1 h-3 w-3 text-green-600" />
                                        Všetky oprávnenia
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                                100%
                            </p>
                            <p className="text-xs text-gray-500">Alokácia</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Team Members */}
            {teamMembers.length > 0 ? (
                <div className="space-y-4">
                    {teamMembers.map((member) => (
                        <Card key={member.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-lg font-semibold text-white">
                                        {member.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {member.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {member.email}
                                        </p>

                                        {/* Permissions by Groups */}
                                        {member.permissions &&
                                            member.permissions.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-xs font-medium text-gray-700">
                                                        Oprávnenia:
                                                    </p>
                                                    {PERMISSION_GROUPS.map(
                                                        (group) => {
                                                            const groupPermValues =
                                                                group.permissions.map(
                                                                    (p) =>
                                                                        p.value,
                                                                );
                                                            const hasPerms =
                                                                groupPermValues.filter(
                                                                    (p) =>
                                                                        member.permissions.includes(
                                                                            p,
                                                                        ),
                                                                );

                                                            if (
                                                                hasPerms.length ===
                                                                0
                                                            )
                                                                return null;

                                                            return (
                                                                <div
                                                                    key={
                                                                        group.label
                                                                    }
                                                                    className="rounded-md bg-gray-50 p-2"
                                                                >
                                                                    <p className="mb-1 text-xs font-semibold text-gray-700">
                                                                        {
                                                                            group.label
                                                                        }
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {hasPerms.map(
                                                                            (
                                                                                perm,
                                                                            ) => (
                                                                                <Badge
                                                                                    key={
                                                                                        perm
                                                                                    }
                                                                                    variant="outline"
                                                                                    className="text-xs text-white bg-blue-600 py-1 px-2"
                                                                                >
                                                                                    {PERMISSION_LABELS[
                                                                                        perm
                                                                                    ] ||
                                                                                        perm}
                                                                                </Badge>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {/* Allocation */}
                                <div className="text-right">
                                    <p
                                        className={`text-2xl font-bold ${
                                            member.allocation > 100
                                                ? 'text-red-600'
                                                : member.allocation > 80
                                                  ? 'text-orange-600'
                                                  : 'text-green-600'
                                        }`}
                                    >
                                        {member.allocation}%
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Alokácia
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        Žiadni členovia tímu
                    </h3>
                    <p className="mb-4 text-sm text-gray-500">
                        Zatiaľ nie sú pridaní žiadni členovia do tímu projektu.
                    </p>
                    <div className="flex items-center justify-center">
                      <ManageTeamDialog project={project} />
                    </div>
                </Card>
            )}
        </div>
    );
};
