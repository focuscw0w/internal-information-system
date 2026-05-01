import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { router } from '@inertiajs/react';
import {
    CheckSquare,
    FolderOpen,
    Loader2,
    MessageSquare,
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

type SearchResultType = 'project' | 'task' | 'user' | 'comment';

interface SearchResultItem {
    type: SearchResultType;
    id: number;
    title: string;
    subtitle: string;
    url: string;
    icon: string;
}

interface SearchResults {
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
    projects: [],
    tasks: [],
    users: [],
    comments: [],
};

const GROUP_LABELS: Record<keyof SearchResults, string> = {
    projects: 'Projekty',
    tasks: 'Úlohy',
    users: 'Používatelia',
    comments: 'Komentáre',
};

const ICON_MAP: Record<
    SearchResultType,
    React.ComponentType<{ className?: string }>
> = {
    project: FolderOpen,
    task: CheckSquare,
    user: UserIcon,
    comment: MessageSquare,
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
        if (trimmed.length < 2) {
            setResults(EMPTY_RESULTS);
            setLoading(false);
            return;
        }

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
    const showEmptyState = trimmed.length < 2;
    const showNoResults =
        !showEmptyState && !loading && flatResults.length === 0;

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
                        placeholder="Hľadať projekty, úlohy, ľudí, komentáre..."
                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        autoFocus
                    />
                    {loading && (
                        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />
                    )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {showEmptyState && (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">
                            Začnite písať (minimálne 2 znaky)...
                        </p>
                    )}

                    {showNoResults && (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">
                            Žiadne výsledky pre „{trimmed}".
                        </p>
                    )}

                    {!showEmptyState && flatResults.length > 0 && (
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
                                            const Icon = ICON_MAP[item.type];

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
