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
    const [statusFilter, setStatusFilter] = useState('');
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
    }, [search, statusFilter, users]);

    const selectedVisibleCount = filteredUsers.filter((user) =>
        selectedIds.has(user.id),
    ).length;
    const allVisibleSelected =
        filteredUsers.length > 0 &&
        selectedVisibleCount === filteredUsers.length;
    const hasFilters = Boolean(search || statusFilter);

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
        setStatusFilter('');
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

                <select
                    className="select text-xs"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="">Všetky stavy</option>
                    <option value="active">Aktívni</option>
                </select>

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
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <input
                                        type="checkbox"
                                        aria-label="Vybrať všetkých používateľov"
                                        checked={allVisibleSelected}
                                        onChange={toggleAllVisible}
                                    />
                                </th>
                                <th>Používateľ</th>
                                <th>Stav</th>
                                <th>Oprávnenia</th>
                                <th>Vytvorený</th>
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
                                <tr key={user.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            aria-label={`Vybrať používateľa ${user.name}`}
                                            checked={selectedIds.has(user.id)}
                                            onChange={() => toggleUser(user.id)}
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
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">
                                                    {user.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge--success">
                                            Aktívny
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-muted-foreground">
                                            {permissionSummary(user)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-muted-foreground">
                                            {new Date(
                                                user.created_at,
                                            ).toLocaleDateString('sk-SK')}
                                        </span>
                                    </td>
                                    <td>
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
                                                className="icon-btn"
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
