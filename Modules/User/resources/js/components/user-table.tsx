import { Checkbox } from '@/components/ui/checkbox';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Search, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AvailablePermissions, ManagedUser } from '../types/types';
import { DeleteUserDialog } from './dialogs/delete-user';
import { EditUserDialog } from './dialogs/edit-user';

interface UserTableProps {
    users: ManagedUser[];
    availablePermissions: AvailablePermissions;
    initialEditUserId?: string;
}

const avatarColors = [
    'bg-pink-600',
    'bg-violet-600',
    'bg-sky-600',
    'bg-emerald-600',
    'bg-amber-700',
    'bg-cyan-700',
];

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const formatLastActive = (dateString: string | null) => {
    if (!dateString) {
        return 'Nikdy';
    }

    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'práve teraz';
    if (diffMin < 60) return `pred ${diffMin} min`;
    if (diffHours < 24) return `pred ${diffHours} h`;
    if (diffDays < 30) return `pred ${diffDays} dňami`;

    return new Date(dateString).toLocaleDateString('sk-SK');
};

const permissionSummary = (user: ManagedUser) => {
    if (user.is_admin) {
        return 'Plný prístup';
    }

    if (user.permissions.length === 0) {
        return 'Bez oprávnení';
    }

    if (user.permissions.length === 1) {
        return '1 oprávnenie';
    }

    if (user.permissions.length < 5) {
        return `${user.permissions.length} oprávnenia`;
    }

    return `${user.permissions.length} oprávnení`;
};

export const UserTable = ({
    users,
    availablePermissions,
    initialEditUserId,
}: UserTableProps) => {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            if (
                query &&
                !`${user.name} ${user.email}`.toLowerCase().includes(query)
            ) {
                return false;
            }

            return true;
        });
    }, [search, users]);

    const selectedVisibleCount = filteredUsers.filter((user) =>
        selectedIds.has(user.id),
    ).length;
    const allVisibleSelected =
        filteredUsers.length > 0 &&
        selectedVisibleCount === filteredUsers.length;
    const hasFilters = Boolean(search);

    const toggleUser = (userId: number) => {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }

            return next;
        });
    };

    const toggleAllVisible = () => {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (allVisibleSelected) {
                filteredUsers.forEach((user) => next.delete(user.id));
            } else {
                filteredUsers.forEach((user) => next.add(user.id));
            }

            return next;
        });
    };

    const resetFilters = () => {
        setSearch('');
    };

    return (
        <section className="space-y-3">
            <div className="command-bar">
                <div className="field-wrap command-bar__search">
                    <Search className="h-4 w-4" />
                    <input
                        className="input input--with-icon w-full"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Hľadať podľa mena alebo e-mailu..."
                    />
                </div>

                {hasFilters && (
                    <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={resetFilters}
                    >
                        <X className="h-3 w-3" />
                        Zrušiť filtre
                    </button>
                )}

                <span className="command-bar__spacer" />
                <span className="text-xs text-muted-foreground">
                    {filteredUsers.length} z {users.length}
                </span>
            </div>

            {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)] px-4 py-3 text-sm text-[var(--accent-blue-text)]">
                    <span>{selectedIds.size} vybraných používateľov</span>
                    <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        Zrušiť výber
                    </button>
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table [&_td]:px-2 [&_th]:px-2 sm:[&_td]:px-4 sm:[&_th]:px-4">
                        <thead>
                            <tr>
                                <th className="hidden w-10 sm:table-cell">
                                    <Checkbox
                                        aria-label="Vybrať všetkých používateľov"
                                        checked={allVisibleSelected}
                                        onCheckedChange={toggleAllVisible}
                                        className="bg-white data-[state=checked]:bg-primary"
                                    />
                                </th>
                                <th>Používateľ</th>
                                <th className="hidden sm:table-cell">
                                    Posledná aktivita
                                </th>
                                <th>Oprávnenia</th>
                                <th className="hidden sm:table-cell">
                                    Vytvorený
                                </th>
                                <th className="text-center">Akcie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                                            <UserRound className="h-8 w-8" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    Žiadni používatelia
                                                </p>
                                                <p className="mt-1 text-xs">
                                                    Skús upraviť hľadanie alebo
                                                    filtre.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    onClick={() =>
                                        router.visit(`/users/${user.id}`)
                                    }
                                    className="cursor-pointer"
                                >
                                    <td
                                        className="hidden sm:table-cell"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            aria-label={`Vybrať používateľa ${user.name}`}
                                            checked={selectedIds.has(user.id)}
                                            onCheckedChange={() =>
                                                toggleUser(user.id)
                                            }
                                            className="bg-white data-[state=checked]:bg-primary"
                                        />
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`avatar avatar--sm ${
                                                    avatarColors[
                                                        user.id %
                                                            avatarColors.length
                                                    ]
                                                }`}
                                            >
                                                {initials(user.name)}
                                            </span>
                                            <div className="min-w-0 max-w-[104px] sm:max-w-none">
                                                <div className="truncate font-medium">
                                                    {user.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden sm:table-cell">
                                        <span className="text-muted-foreground">
                                            {formatLastActive(
                                                user.last_active_at,
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-muted-foreground">
                                            {permissionSummary(user)}
                                        </span>
                                    </td>
                                    <td className="hidden sm:table-cell">
                                        <span className="text-muted-foreground">
                                            {new Date(
                                                user.created_at,
                                            ).toLocaleDateString('sk-SK')}
                                        </span>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1">
                                            <EditUserDialog
                                                user={user}
                                                availablePermissions={
                                                    availablePermissions
                                                }
                                                initialOpen={
                                                    String(user.id) ===
                                                    initialEditUserId
                                                }
                                            />
                                            {!user.is_admin && (
                                                <DeleteUserDialog user={user} />
                                            )}
                                            <button
                                                type="button"
                                                className="icon-btn hidden sm:inline-flex"
                                                disabled
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
