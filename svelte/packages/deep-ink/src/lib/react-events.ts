// React-named DOM handlers (onClick, onKeyDown, onMouseEnter...) for the Svelte ports. Svelte only listens to the
// lowercase names (onclick): spread as is, `onKeyDown` would listen to a "KeyDown" event that never fires.
import type { DOMAttributes } from 'svelte/elements';

/** React name -> native event name, for the handlers typed by `ReactHandlers`. Any other `on[A-Z]...` prop is lowercased. */
const NAMES = {
  onClick: 'click', onDoubleClick: 'dblclick', onContextMenu: 'contextmenu', onAuxClick: 'auxclick',
  onMouseDown: 'mousedown', onMouseUp: 'mouseup', onMouseEnter: 'mouseenter', onMouseLeave: 'mouseleave',
  onMouseMove: 'mousemove', onMouseOver: 'mouseover', onMouseOut: 'mouseout',
  onPointerDown: 'pointerdown', onPointerUp: 'pointerup', onPointerEnter: 'pointerenter', onPointerLeave: 'pointerleave',
  onPointerMove: 'pointermove', onPointerCancel: 'pointercancel',
  onTouchStart: 'touchstart', onTouchEnd: 'touchend', onTouchMove: 'touchmove', onTouchCancel: 'touchcancel',
  onKeyDown: 'keydown', onKeyUp: 'keyup', onFocus: 'focus', onBlur: 'blur',
  onInput: 'input', onChange: 'change', onBeforeInput: 'beforeinput', onInvalid: 'invalid', onSelect: 'select',
  onCopy: 'copy', onCut: 'cut', onPaste: 'paste', onScroll: 'scroll', onWheel: 'wheel',
  onDrag: 'drag', onDragStart: 'dragstart', onDragEnd: 'dragend', onDragEnter: 'dragenter', onDragLeave: 'dragleave',
  onDragOver: 'dragover', onDrop: 'drop', onAnimationStart: 'animationstart', onAnimationEnd: 'animationend',
  onTransitionEnd: 'transitionend', onToggle: 'toggle',
} as const;

type Names = typeof NAMES;

/** The React-named handlers, typed as their Svelte (lowercase) counterparts. */
export type ReactHandlers<E extends EventTarget> = {
  [K in keyof Names]?: DOMAttributes<E>[`on${Names[K]}` & keyof DOMAttributes<E>];
};

const native = (key: string) => `on${(NAMES as Record<string, string>)[key] ?? key.slice(2).toLowerCase()}`;

type Handler = (event: Event) => void;

/**
 * Returns the props with every React-named handler under its native Svelte name. When both are given (`onclick` and
 * `onClick`), both are called, the native one first.
 */
export function reactEvents<P extends Record<string, unknown>>(props: P): Record<string, unknown> {
  const out: Record<string, unknown> = { ...props };
  for (const [key, value] of Object.entries(props)) {
    if (!/^on[A-Z]/.test(key)) continue;
    delete out[key];
    if (typeof value !== 'function') continue;
    const name = native(key);
    const prev = out[name];
    out[name] = typeof prev === 'function' ? (e: Event) => ((prev as Handler)(e), (value as Handler)(e)) : value;
  }
  return out;
}
