import { Breadcrumbs } from '@/components/breadcrumbs';
import { GlobalSearchDialog } from '@/components/global-search/global-search-dialog';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                setSearchOpen((open) => !open);
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <>
            <header className="grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:grid-cols-[minmax(0,1fr)_minmax(16rem,28rem)_minmax(0,1fr)] md:px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>

                <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="hidden h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-xs transition-[border-color,color,box-shadow] hover:border-primary/40 hover:text-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:outline-none md:flex"
                    title="Hľadať (Ctrl/Cmd + K)"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <Search className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">Hľadať...</span>
                    </span>
                    <kbd className="ml-3 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Ctrl K
                    </kbd>
                </button>

                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSearchOpen(true)}
                        title="Hľadať (Ctrl/Cmd + K)"
                    >
                        <Search className="h-5 w-5 text-primary" />
                    </Button>
                    <NotificationBell />
                </div>
            </header>
            <GlobalSearchDialog
                open={searchOpen}
                onOpenChange={setSearchOpen}
            />
        </>
    );
}
