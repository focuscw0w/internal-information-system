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
                <SidebarGroup className="px-2 py-0" key={index}>
                    <SidebarGroupLabel>{moduleGroup.title}</SidebarGroupLabel>

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
                                    >
                                        <Link href={item.href} prefetch>
                                            <Icon className={cn('h-4 w-4', isActive && 'text-sidebar-primary')} />
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
