import { Clock, FolderKanban, Gauge, LayoutDashboard, Users } from 'lucide-react';

export const iconMap = {
    FolderKanban,
    Clock,
    Gauge,
    Users,
    LayoutDashboard,
} as const;

export type IconName = keyof typeof iconMap;

export function resolveIcon(name?: string | null) {
  if (name && name in iconMap) {
    return iconMap[name as IconName];
  }

  return iconMap.FolderKanban; 
}
