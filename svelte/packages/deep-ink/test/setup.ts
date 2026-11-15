// Shared Vitest setup for the component specs (jsdom), same as react/packages/deep-ink/test/setup.ts.
// - unmounts rendered components after each test (Testing Library only does it with globals);
// - fills in the pieces of the platform that jsdom does not implement: <dialog> modality, popover and
//   the keyboard activation of <summary>.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

afterEach(() => cleanup());

const dialogProto = typeof HTMLDialogElement === 'undefined' ? undefined : (HTMLDialogElement.prototype as unknown as Record<string, unknown>);
if (dialogProto) {
  dialogProto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  dialogProto.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    // The platform fires "close" asynchronously.
    queueMicrotask(() => this.dispatchEvent(new Event('close')));
  };
}

if (typeof HTMLElement !== 'undefined') {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  const toggle = (el: HTMLElement, newState: 'open' | 'closed') => {
    const e = new Event('toggle');
    (e as Event & { newState: string }).newState = newState;
    el.dispatchEvent(e);
  };
  proto.showPopover = function showPopover(this: HTMLElement) {
    this.setAttribute('data-popover-open', '');
    toggle(this, 'open');
  };
  proto.hidePopover = function hidePopover(this: HTMLElement) {
    if (!this.hasAttribute('data-popover-open')) return;
    this.removeAttribute('data-popover-open');
    toggle(this, 'closed');
  };
}

// jsdom hides [popover] elements; show the ones our polyfill opened.
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = '[popover][data-popover-open] { display: block !important; }';
  document.head.appendChild(style);
}

// The platform activates a <details> summary with Enter (keydown) and Space (keyup), as a click; jsdom does not.
if (typeof document !== 'undefined') {
  const summary = (e: Event) => {
    const t = e.target as Element | null;
    return t?.localName === 'summary' && t.parentElement?.localName === 'details' ? (t as HTMLElement) : undefined;
  };
  document.addEventListener('keydown', (e) => {
    const s = summary(e);
    if (!s || e.defaultPrevented) return;
    if (e.key === 'Enter') s.click();
    if (e.key === ' ') e.preventDefault();
  });
  document.addEventListener('keyup', (e) => {
    const s = summary(e);
    if (s && e.key === ' ' && !e.defaultPrevented) s.click();
  });
}
