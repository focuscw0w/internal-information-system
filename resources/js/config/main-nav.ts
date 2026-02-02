import { FolderKanban } from 'lucide-react';

export const iconMap = {
    FolderKanban,
} as const;

export type IconName = keyof typeof iconMap;

export function resolveIcon(name?: string | null) {
  if (name && name in iconMap) {
    return iconMap[name as IconName];
  }

  return iconMap.FolderKanban; 
}