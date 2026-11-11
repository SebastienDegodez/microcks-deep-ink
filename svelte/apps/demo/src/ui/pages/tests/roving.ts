import type { Attachment } from 'svelte/attachments';

/**
 * Roving tabindex for a group of toggle buttons (chart bars, heatmap days): one tab stop, arrow keys move
 * the selection. `next(index, key)` returns the new index for an arrow key or `undefined` to ignore the key.
 */
export function useRovingSelection(onSelect: (index: number) => void, next: (index: number, key: string) => number | undefined) {
  const refs = new Map<number, HTMLButtonElement>();
  const register =
    (index: number): Attachment<HTMLButtonElement> =>
    (el) => {
      refs.set(index, el);
      return () => {
        if (refs.get(index) === el) refs.delete(index);
      };
    };
  const onKeyDown = (index: number) => (e: KeyboardEvent) => {
    const target = next(index, e.key);
    if (target === undefined || !refs.has(target)) return;
    e.preventDefault();
    onSelect(target);
    refs.get(target)?.focus();
  };
  return { register, onKeyDown };
}
