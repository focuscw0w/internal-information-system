import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { router } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    CheckSquare,
    ClipboardCheck,
    FolderOpen,
    FolderPlus,
    LayoutDashboard,
    Loader2,
    MessageSquare,
    PlusCircle,
    Search,
    User as UserIcon,
} from 'lucide-react';
import {
    KeyboardEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type SearchResultType = 'action' | 'project' | 'task' | 'user' | 'comment';

interface SearchResultItem {
    type: SearchResultType;
    id: number | string;
    title: string;
    subtitle: string;
    url: string;
    icon: string;
}

interface SearchResults {
    actions: SearchResultItem[];
    projects: SearchResultItem[];
    tasks: SearchResultItem[];
    users: SearchResultItem[];
    comments: SearchResultItem[];
}

interface GlobalSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMPTY_RESULTS: SearchResults = {
    actions: [],
    projects: [],
    tasks: [],
    users: [],
    comments: [],
};

const GROUP_LABELS: Record<keyof SearchResults, string> = {
    actions: 'Akcie',
    projects: 'Projekty',
    tasks: 'Úlohy',
    users: 'Používatelia',
    comments: 'Komentáre',
};

const ICON_MAP: Record<
    SearchResultType,
    React.ComponentType<{ className?: string }>
> = {
    action: PlusCircle,
    project: FolderOpen,
    task: CheckSquare,
    user: UserIcon,
    comment: MessageSquare,
};

const ACTION_ICON_MAP: Record<
    string,
    React.ComponentType<{ className?: string }>
> = {
    activity: Activity,
    'bar-chart-3': BarChart3,
    'clipboard-check': ClipboardCheck,
    'folder-plus': FolderPlus,
    'layout-dashboard': LayoutDashboard,
    'plus-circle': PlusCircle,
};

export function GlobalSearchDialog({
    open,
    onOpenChange,
}: GlobalSearchDialogProps) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebouncedValue(query, 250);

    const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const abortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const flatResults = useMemo<SearchResultItem[]>(
        () => [
            ...results.actions,
            ...results.projects,
            ...results.tasks,
            ...results.users,
            ...results.comments,
        ],
        [results],
    );

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults(EMPTY_RESULTS);
            setActiveIndex(0);
            abortRef.current?.abort();
            abortRef.current = null;
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const trimmed = debouncedQuery.trim();

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        fetch(`/api/global-search?q=${encodeURIComponent(trimmed)}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
            credentials: 'same-origin',
        })
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then((data: { results: SearchResults }) => {
                setResults(data.results ?? EMPTY_RESULTS);
                setActiveIndex(0);
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setResults(EMPTY_RESULTS);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [debouncedQuery, open]);

    const navigate = useCallback(
        (item: SearchResultItem) => {
            onOpenChange(false);
            router.visit(item.url);
        },
        [onOpenChange],
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (flatResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % flatResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(
                (i) => (i - 1 + flatResults.length) % flatResults.length,
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = flatResults[activeIndex];
            if (item) navigate(item);
        }
    };

    const trimmed = debouncedQuery.trim();
    const showEmptyState = !loading && flatResults.length === 0;
    const showNoResults = trimmed.length > 0 && showEmptyState;
    const showStartState = trimmed.length === 0 && showEmptyState;

    let cursor = 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl gap-0 p-0 sm:max-w-2xl">
                <DialogTitle className="sr-only">
                    Globálne vyhľadávanie
                </DialogTitle>
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                    <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Hľadať projekty, úlohy, ľudí, komentáre alebo akcie..."
                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        autoFocus
                    />
                    {loading && (
                        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />
                    )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {showStartState && (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">
                            Žiadne rýchle akcie nie sú dostupné.
                        </p>
                    )}

                    {showNoResults && (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">
                            Žiadne výsledky pre „{trimmed}".
                        </p>
                    )}

                    {flatResults.length > 0 && (
                        <div className="space-y-1">
                            {(
                                Object.keys(GROUP_LABELS) as Array<
                                    keyof SearchResults
                                >
                            ).map((groupKey) => {
                                const items = results[groupKey];
                                if (items.length === 0) return null;

                                return (
                                    <div key={groupKey}>
                                        <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                                            {GROUP_LABELS[groupKey]}
                                        </div>
                                        {items.map((item) => {
                                            const itemIndex = cursor++;
                                            const isActive =
                                                itemIndex === activeIndex;
                                            const Icon =
                                                item.type === 'action'
                                                    ? (ACTION_ICON_MAP[
                                                          item.icon
                                                      ] ?? ICON_MAP.action)
                                                    : ICON_MAP[item.type];

                                            return (
                                                <button
                                                    type="button"
                                                    key={`${item.type}-${item.id}`}
                                                    onMouseEnter={() =>
                                                        setActiveIndex(
                                                            itemIndex,
                                                        )
                                                    }
                                                    onClick={() =>
                                                        navigate(item)
                                                    }
                                                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                                                        isActive
                                                            ? 'bg-primary/5 text-primary'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`h-4 w-4 flex-shrink-0 ${
                                                            isActive
                                                                ? 'text-primary'
                                                                : 'text-gray-400'
                                                        }`}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium">
                                                            {item.title}
                                                        </div>
                                                        {item.subtitle && (
                                                            <div className="truncate text-xs text-gray-500">
                                                                {item.subtitle}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400">
                    <span>↑↓ navigácia · ↵ otvoriť · Esc zatvoriť</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
