// React-named DOM handlers (onClick, onKeyDown, onMouseEnter, onClickCapture...) for the Svelte ports. Svelte only
// listens to the lowercase native names (onclick, onclickcapture): spread as is, `onKeyDown` would listen to a "KeyDown"
// event that never fires, and `onDoubleClickCapture` to a "doubleclick" event.
import type { DOMAttributes } from 'svelte/elements';

/**
 * React name -> native event name, for the handlers typed by `ReactHandlers`. Any other `on[A-Z]...` prop is
 * lowercased. As in React, onFocus and onBlur listen to the bubbling focusin and focusout (they also fire when a
 * descendant gains or loses focus), and onMouseEnter / onMouseLeave to the non-bubbling mouseenter / mouseleave.
 * React's onChange of a text field fires on every input: Input and Textarea pass `{ onChange: 'input' }`.
 */
const NAMES = {
  onClick: 'click', onDoubleClick: 'dblclick', onContextMenu: 'contextmenu', onAuxClick: 'auxclick',
  onMouseDown: 'mousedown', onMouseUp: 'mouseup', onMouseEnter: 'mouseenter', onMouseLeave: 'mouseleave',
  onMouseMove: 'mousemove', onMouseOver: 'mouseover', onMouseOut: 'mouseout',
  onPointerDown: 'pointerdown', onPointerUp: 'pointerup', onPointerEnter: 'pointerenter', onPointerLeave: 'pointerleave',
  onPointerMove: 'pointermove', onPointerCancel: 'pointercancel', onPointerOver: 'pointerover', onPointerOut: 'pointerout',
  onGotPointerCapture: 'gotpointercapture', onLostPointerCapture: 'lostpointercapture',
  onTouchStart: 'touchstart', onTouchEnd: 'touchend', onTouchMove: 'touchmove', onTouchCancel: 'touchcancel',
  onKeyDown: 'keydown', onKeyUp: 'keyup', onFocus: 'focusin', onBlur: 'focusout',
  onInput: 'input', onChange: 'change', onBeforeInput: 'beforeinput', onInvalid: 'invalid', onSelect: 'select',
  onCopy: 'copy', onCut: 'cut', onPaste: 'paste', onScroll: 'scroll', onWheel: 'wheel',
  onDrag: 'drag', onDragStart: 'dragstart', onDragEnd: 'dragend', onDragEnter: 'dragenter', onDragLeave: 'dragleave',
  onDragOver: 'dragover', onDrop: 'drop', onAnimationStart: 'animationstart', onAnimationEnd: 'animationend',
  onAnimationIteration: 'animationiteration', onTransitionEnd: 'transitionend', onToggle: 'toggle',
} as const;

type Names = typeof NAMES;

type Bubble<E extends EventTarget> = {
  [K in keyof Names]?: DOMAttributes<E>[`on${Names[K]}` & keyof DOMAttributes<E>];
};

/** The React-named handlers and their `Capture` variants, typed as their Svelte (lowercase) counterparts. */
export type ReactHandlers<E extends EventTarget> = Bubble<E> & {
  [K in keyof Names as `${K}Capture`]?: Bubble<E>[K];
};

/** Per-component remapping of a React name to a native event, e.g. `{ onChange: 'input' }` for a text field. */
export type ReactEventOverrides = Partial<Record<keyof Names, string>>;

/**
 * The native event and phase a React-named handler listens to, or `undefined` if `key` is not a React handler name.
 * `onClickCapture` -> `{ event: 'click', capture: true }`.
 */
export function reactEventName(key: string, overrides: ReactEventOverrides = {}): { event: string; capture: boolean } | undefined {
  if (!/^on[A-Z]/.test(key)) return undefined;
  const known = (name: string): string | undefined =>
    (overrides as Record<string, string | undefined>)[name] ?? (NAMES as Record<string, string | undefined>)[name];
  const direct = known(key);
  if (direct) return { event: direct, capture: false };
  const base = key.endsWith('Capture') ? key.slice(0, -'Capture'.length) : undefined;
  if (base && /^on[A-Z]/.test(base)) return { event: known(base) ?? base.slice(2).toLowerCase(), capture: true };
  return { event: key.slice(2).toLowerCase(), capture: false };
}

type Handler = (event: Event) => void;

/**
 * Returns the props with every React-named handler under its native Svelte name (`onclick`, `onclickcapture` for a
 * capture-phase listener). When both are given (`onclick` and `onClick`), both are called, the native one first.
 */
export function reactEvents<P extends Record<string, unknown>>(props: P, overrides: ReactEventOverrides = {}): Record<string, unknown> {
  const out: Record<string, unknown> = { ...props };
  for (const [key, value] of Object.entries(props)) {
    const native = reactEventName(key, overrides);
    if (!native) continue;
    delete out[key];
    if (typeof value !== 'function') continue;
    const name = `on${native.event}${native.capture ? 'capture' : ''}`;
    const prev = out[name];
    out[name] = typeof prev === 'function' ? (e: Event) => ((prev as Handler)(e), (value as Handler)(e)) : value;
  }
  return out;
}
