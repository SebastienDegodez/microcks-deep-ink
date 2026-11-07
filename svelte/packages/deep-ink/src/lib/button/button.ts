export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'dashed' | 'danger';
export type ButtonSize = 'sm' | 'compact' | 'tile' | 'md' | 'lg';

const warned = new Set<string>();

/** Logs once per component when an icon-only button has no accessible name. */
export function requireName(component: string, iconOnly: boolean | undefined, props: Record<string, unknown>): void {
  if (!iconOnly || props['aria-label'] || props['aria-labelledby'] || props.title) return;
  const key = `${component}:icon-only`;
  if (warned.has(key)) return;
  warned.add(key);
  console.error(`Deep Ink ${component}: an icon-only button needs an accessible name. Add aria-label.`);
}

/** Leading icon size: 14px in small buttons and text-like variants, 16px otherwise. */
export const iconSize = (size: ButtonSize, variant: ButtonVariant): number =>
  size === 'sm' || size === 'compact' || size === 'tile' || variant === 'link' || variant === 'dashed' ? 14 : 16;
