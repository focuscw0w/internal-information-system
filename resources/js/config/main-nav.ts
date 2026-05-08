import { Briefcase, Clock, Gauge, Layers, Users } from 'lucide-react';

export const iconMap = {
    Briefcase,
    Clock,
    Gauge,
    Layers,
    Users,
} as const;

export type IconName = keyof typeof iconMap;

export function resolveIcon(name?: string | null) {
  if (name && name in iconMap) {
    return iconMap[name as IconName];
  }

  return iconMap.Briefcase;
}
