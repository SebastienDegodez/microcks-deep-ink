import { tick } from 'svelte';
import { PAGE_TITLE_ID } from './page-title.svelte.js';

/**
 * Focus management for controls that unmount (WCAG 2.4.3, RGAA 12.8).
 *
 * When the focused control disappears (a deleted row, a closed form, a finished live run), the browser
 * drops focus to `<body>` and keyboard and screen-reader users lose their place. These helpers move
 * focus to a sensible element instead.
 *
 * @example Delete, then focus the Undo button that replaces the row
 * ```svelte
 * const { focusLater } = useReturnFocus();
 * <Button onclick={() => { remove(id); focusLater('[data-undo]'); }}>Delete</Button>
 * ```
 *
 * @example Close an inline form, then return to the button that opened it
 * ```svelte
 * let opener = $state<HTMLButtonElement>();
 * const { focusLater } = useReturnFocus();
 * const close = () => { open = false; focusLater(() => opener); };
 * ```
 *
 * @example End of a live run: focus the verdict heading (give it tabindex="-1")
 * ```svelte
 * $effect(() => { if (run.done) focusLater(() => document.getElementById('verdict-title')); });
 * ```
 *
 * @example Form that opens in place: focus its first field when it appears
 * ```svelte
 * let form = $state<HTMLFormElement>();
 * useAutoFocus(() => form, () => open); // focuses [data-autofocus] inside, else the first field
 * ```
 */

/** What to focus: a ref, a CSS selector (resolved in `document`), or a function returning the element. */
export type FocusTarget = { readonly current: HTMLElement | null | undefined } | string | (() => HTMLElement | null | undefined);

/** Region-like ancestors that can take focus when the target is gone. */
const REGION = 'section, [role="region"], [role="tabpanel"], [role="dialog"], form, article, aside, main';
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function resolve(target: FocusTarget): HTMLElement | null {
  if (typeof target === 'string') return document.querySelector<HTMLElement>(target);
  if (typeof target === 'function') return target() ?? null;
  return target.current ?? null;
}

function canFocus(el: HTMLElement | null): el is HTMLElement {
  if (!el || !el.isConnected) return false;
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.closest('[hidden], [inert]')) return false;
  return true;
}

/** Focuses `el`, making a region focusable (tabindex -1) when it is not already. */
function focusRegion(el: HTMLElement): void {
  if (!el.matches(FOCUSABLE) && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus();
}

/** The region ancestors of `el`, closest first, captured while `el` is still in the document. */
function regionsOf(el: Element | null): HTMLElement[] {
  const out: HTMLElement[] = [];
  let node = el?.parentElement?.closest<HTMLElement>(REGION) ?? null;
  while (node) {
    out.push(node);
    node = node.parentElement?.closest<HTMLElement>(REGION) ?? null;
  }
  return out;
}

/**
 * Moves focus to `target`; if it is missing, to the closest region that contained the previously focused
 * element and is still in the page; else to the page `<h1>`.
 */
export function moveFocus(target: FocusTarget, regions: HTMLElement[] = []): HTMLElement | null {
  const el = resolve(target);
  if (canFocus(el)) {
    el.focus();
    if (document.activeElement === el) return el;
  }
  const region = regions.find((r) => r.isConnected && !r.closest('[hidden], [inert]'));
  if (region) {
    focusRegion(region);
    return region;
  }
  const h1 = document.getElementById(PAGE_TITLE_ID);
  if (h1) {
    h1.focus();
    return h1;
  }
  return null;
}

interface Pending {
  target: FocusTarget;
  regions: HTMLElement[];
}

/**
 * `focusLater(target)` moves focus to `target` once the DOM has been updated, so call it in the same
 * handler that removes the focused control. Call the hook in a component that stays mounted (the list,
 * not the row). Fallbacks: the closest region that contained the focused element, then the page `<h1>`.
 */
export function useReturnFocus(): { focusLater: (target: FocusTarget) => void } {
  let pending: Pending | null = null;

  const focusLater = (target: FocusTarget) => {
    const scheduled = pending !== null;
    pending = { target, regions: regionsOf(document.activeElement) };
    if (scheduled) return;
    void tick().then(() => {
      const p = pending;
      pending = null;
      if (p) moveFocus(p.target, p.regions);
    });
  };

  return { focusLater };
}

/**
 * Focuses an inline form or panel when `when()` turns true: `[data-autofocus]` inside it, else its first
 * focusable field, else the container itself (with tabindex -1). The registry's `data-autofocus` only
 * works inside Dialog; this is the same contract for content that opens in place. Bind the container
 * to a `$state` variable so the focus waits for it to be in the document.
 */
export function useAutoFocus(root: () => HTMLElement | null | undefined, when: () => boolean): void {
  $effect(() => {
    if (!when()) return;
    const el = root();
    if (!el || !el.isConnected) return;
    const target = el.querySelector<HTMLElement>('[data-autofocus]') ?? (el.matches(FOCUSABLE) ? el : el.querySelector<HTMLElement>(FOCUSABLE));
    if (canFocus(target)) target.focus();
    else focusRegion(el);
  });
}
