import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { FolderKanban } from 'lucide-react';

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

                            return (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(href)}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            <FolderKanban className="h-4 w-4" />
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
