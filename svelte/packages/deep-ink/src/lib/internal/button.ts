import type { ButtonSize, ButtonVariant } from '../types.js';

const warned = new Set<string>();

export function requireName(component: string, iconOnly: boolean | undefined, attributes: Record<string, unknown>) {
  if (iconOnly && !['aria-label', 'aria-labelledby', 'title'].some((name) =>
    typeof attributes[name] === 'string' && attributes[name].trim(),
  ) && !warned.has(component)) {
    warned.add(component);
    console.error(`Deep Ink ${component}: an icon-only button needs an accessible name. Add aria-label.`);
  }
}

export function buttonAttributes(component: string, props: {
  variant: ButtonVariant; size: ButtonSize; tone?: 'danger' | 'link';
  confirm?: boolean; iconOnly?: boolean; loading?: boolean;
}, attributes: Record<string, unknown>) {
  requireName(component, props.iconOnly, attributes);
  return {
    'data-variant': props.variant,
    'data-size': props.size,
    'data-tone': props.tone,
    'data-confirm': props.confirm ? '' : undefined,
    'data-icon-only': props.iconOnly ? '' : undefined,
    'aria-busy': props.loading ? true as const : undefined,
  };
}

export const iconSize = (size: ButtonSize, variant: ButtonVariant) =>
  ['xs', 'sm', 'compact', 'tile'].includes(size) || ['link', 'dashed'].includes(variant) ? 14 : 16;
