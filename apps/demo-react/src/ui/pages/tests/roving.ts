import { useCallback, useRef, type KeyboardEvent } from 'react';

/**
 * Roving tabindex for a group of toggle buttons (chart bars, heatmap days): one tab stop, arrow keys move
 * the selection. `next(index, key)` returns the new index for an arrow key or `undefined` to ignore the key.
 */
export function useRovingSelection(onSelect: (index: number) => void, next: (index: number, key: string) => number | undefined) {
  const refs = useRef(new Map<number, HTMLButtonElement>());
  const register = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      if (el) refs.current.set(index, el);
      else refs.current.delete(index);
    },
    [],
  );
  const onKeyDown = (index: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const target = next(index, e.key);
    if (target === undefined || !refs.current.has(target)) return;
    e.preventDefault();
    onSelect(target);
    refs.current.get(target)?.focus();
  };
  return { register, onKeyDown };
}
