import {
    BarChart3,
    Briefcase,
    Clock,
    Gauge,
    Layers,
    LayoutDashboard,
    Users,
} from 'lucide-react';

export const iconMap = {
    BarChart3,
    Briefcase,
    Clock,
    Gauge,
    Layers,
    LayoutDashboard,
    Users,
} as const;

export type IconName = keyof typeof iconMap;

export function resolveIcon(name?: string | null) {
  if (name && name in iconMap) {
    return iconMap[name as IconName];
  }

  return iconMap.Briefcase;
}
