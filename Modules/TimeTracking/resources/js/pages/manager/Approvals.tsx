import ManagerLayout from '@/layouts/ManagerLayout';
import { Head, router } from '@inertiajs/react';
import { Check, CheckCheck, Filter, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Entry = {
    id: number;
    project_id: number;
    task_id: number;
    user_id: number;
    entry_date: string;
    hours: number;
    description: string | null;
    user: { id: number; name: string; email: string | null };
    project: { id: number; name: string };
    task: { id: number; title: string };
};

type Option = {
    id: number;
    name: string;
    email?: string | null;
};

type Paginator<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    entries: Paginator<Entry>;
    filters: Record<string, string | null>;
    filterOptions: {
        users: Option[];
        projects: Option[];
    };
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const formatHours = (hours: number) =>
    new Intl.NumberFormat('sk-SK', { maximumFractionDigits: 2 }).format(hours);

export default function Approvals({ entries, filters, filterOptions }: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const [rejectEntry, setRejectEntry] = useState<Entry | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterState, setFilterState] = useState({
        user_id: filters.user_id ?? '',
        project_id: filters.project_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const allSelected = entries.data.length > 0 && selected.length === entries.data.length;

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/manager/time/approvals', filterState, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterState({ user_id: '', project_id: '', date_from: '', date_to: '' });
        router.get('/manager/time/approvals');
    };

    const approve = (id: number) => {
        router.post(`/manager/time/approvals/${id}/approve`, {}, { preserveScroll: true });
    };

    const bulkApprove = () => {
        if (selected.length === 0) return;

        router.post(
            '/manager/time/approvals/bulk',
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: () => setSelected([]),
            },
        );
    };

    const submitReject = () => {
        if (!rejectEntry) return;

        router.post(
            `/manager/time/approvals/${rejectEntry.id}/reject`,
            { rejection_reason: rejectionReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectEntry(null);
                    setRejectionReason('');
                },
            },
        );
    };

    return (
        <ManagerLayout
            breadcrumbs={[
                { title: 'Manažér', href: '/manager' },
                { title: 'Time Approvals', href: '/manager/time/approvals' },
            ]}
        >
            <Head title="Time Approvals" />
            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Time Approvals</h1>
                        <p className="page-head__subtitle">
                            Pending záznamy z projektov, kde máte správu time entries.
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <button
                            type="button"
                            className="btn btn--primary"
                            disabled={selected.length === 0}
                            onClick={bulkApprove}
                        >
                            <CheckCheck className="h-4 w-4" />
                            Approve selected
                            {selected.length > 0 ? <span>{selected.length}</span> : null}
                        </button>
                    </div>
                </div>

                <form className="command-bar" onSubmit={applyFilters}>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <div className="command-bar__filters">
                        <select
                            className="select"
                            value={filterState.user_id}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    user_id: event.target.value,
                                }))
                            }
                        >
                            <option value="">Všetci používatelia</option>
                            {filterOptions.users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="select"
                            value={filterState.project_id}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    project_id: event.target.value,
                                }))
                            }
                        >
                            <option value="">Všetky projekty</option>
                            {filterOptions.projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        <input
                            className="input"
                            type="date"
                            value={filterState.date_from}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    date_from: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="input"
                            type="date"
                            value={filterState.date_to}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    date_to: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="command-bar__spacer" />
                    <div className="command-bar__actions">
                        <button type="submit" className="btn btn--primary">
                            Použiť
                        </button>
                        <button type="button" className="btn" onClick={clearFilters}>
                            Vyčistiť
                        </button>
                    </div>
                </form>

                <section className="card">
                    <div className="card__head">
                        <div>
                            <h3 className="card__title">Fronta schvaľovania</h3>
                            <div className="card__sub">
                                {entries.from ?? 0}-{entries.to ?? 0} z {entries.total}
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(event) =>
                                                setSelected(
                                                    event.target.checked
                                                        ? entries.data.map((entry) => entry.id)
                                                        : [],
                                                )
                                            }
                                        />
                                    </th>
                                    <th>Dátum</th>
                                    <th>Používateľ</th>
                                    <th>Projekt</th>
                                    <th>Úloha</th>
                                    <th>Hodiny</th>
                                    <th>Popis</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {entries.data.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedSet.has(entry.id)}
                                                onChange={(event) =>
                                                    setSelected((current) =>
                                                        event.target.checked
                                                            ? [...current, entry.id]
                                                            : current.filter((id) => id !== entry.id),
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="mono">{entry.entry_date}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="avatar avatar--sm">
                                                    {initials(entry.user.name)}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium">
                                                        {entry.user.name}
                                                    </span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {entry.user.email}
                                                    </span>
                                                </span>
                                            </div>
                                        </td>
                                        <td>{entry.project.name}</td>
                                        <td className="max-w-56 truncate">{entry.task.title}</td>
                                        <td className="mono font-semibold">
                                            {formatHours(entry.hours)} h
                                        </td>
                                        <td className="max-w-72 truncate text-muted-foreground">
                                            {entry.description ?? '-'}
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn--sm btn--primary"
                                                    onClick={() => approve(entry.id)}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn--sm"
                                                    onClick={() => setRejectEntry(entry)}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {entries.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-10 text-center text-muted-foreground">
                                            Žiadne pending záznamy.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="card__body flex flex-wrap gap-2">
                        {entries.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                className={`btn btn--sm ${link.active ? 'btn--primary' : ''}`}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </section>
            </div>

            <Dialog open={!!rejectEntry} onOpenChange={(open) => !open && setRejectEntry(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zamietnuť záznam</DialogTitle>
                        <DialogDescription>
                            Dôvod zamietnutia sa uloží pri time entry.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        className="textarea w-full"
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        maxLength={500}
                        required
                    />
                    <DialogFooter>
                        <button type="button" className="btn" onClick={() => setRejectEntry(null)}>
                            Zrušiť
                        </button>
                        <button
                            type="button"
                            className="btn btn--primary"
                            disabled={!rejectionReason.trim()}
                            onClick={submitReject}
                        >
                            Zamietnuť
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
