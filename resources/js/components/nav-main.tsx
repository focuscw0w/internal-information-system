import { resolveIcon } from '@/config/main-nav';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavGroup } from '@/types';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({
    moduleNavItems = [],
}: {
    moduleNavItems: NavGroup[];
}) {
    const page = usePage();
    return (
        <>
            {moduleNavItems.map((moduleGroup, index) => (
                <SidebarGroup className="px-0 py-0" key={index}>
                    <SidebarGroupLabel className="h-6 px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {moduleGroup.title}
                    </SidebarGroupLabel>

                    <SidebarMenu>
                        {moduleGroup.items.map((item) => {
                            const href =
                                typeof item.href === 'string'
                                    ? item.href
                                    : item.href.url;

                            const isActive = page.url.startsWith(href);
                            const Icon = resolveIcon(item.icon);

                            return (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        className={cn(
                                            'h-11 rounded-md text-[15px] text-sidebar-foreground/90 md:h-8 md:text-[13px]',
                                            isActive &&
                                                "relative before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-r-sm before:bg-[var(--accent-blue)] before:content-['']",
                                        )}
                                    >
                                        <Link href={item.href} prefetch>
                                            <Icon
                                                className={cn(
                                                    'h-4 w-4',
                                                    isActive &&
                                                        'text-[var(--accent-blue)]',
                                                )}
                                            />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
