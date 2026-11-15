import type { HTMLAttributes } from 'svelte/elements';
export interface SkillItem {
  id: string; name: string; calls?: number; tags?: string[]; meta?: string; result?: 'pass' | 'fail'; resultNote?: string; fallback?: boolean;
}
export interface SkillListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children' | 'onSelect'> {
  label: string; skills: SkillItem[]; selectedId?: string; onselectskill?: (id: string) => void; class?: string;
}
