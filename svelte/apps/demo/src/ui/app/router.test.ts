import type { Component } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { createRouter, type AppRoute, type PageModule, type Router } from './router.svelte.js';

const Page = (() => {}) as unknown as Component;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const loaded = () => Promise.resolve<PageModule>({ default: Page });

function routes(overrides: Partial<Record<string, () => Promise<PageModule>>> = {}): AppRoute[] {
  const leaf = (id: string, path: string): AppRoute => ({ id, path, load: overrides[id] ?? loaded });
  return [
    {
      id: 'shell',
      path: '/',
      children: [
        { id: 'home', index: true, load: overrides.home ?? loaded },
        leaf('item', 'items/:itemId/:tab?'),
        leaf('new-item', 'items/new'),
        leaf('slow', 'slow'),
        leaf('broken', 'broken'),
        leaf('not-found', '*'),
      ],
    },
  ];
}

let router: Router | undefined;

async function start(path: string, overrides?: Parameters<typeof routes>[0]): Promise<Router> {
  window.history.replaceState(null, '', `#${path}`);
  router = createRouter(routes(overrides));
  await until(() => router?.ready === true);
  return router;
}

async function until(condition: () => boolean): Promise<void> {
  for (let i = 0; i < 50 && !condition(); i += 1) await new Promise((r) => setTimeout(r, 0));
  expect(condition()).toBe(true);
}

const leafId = (r: Router) => r.matches[r.matches.length - 1]?.route.id;

afterEach(() => {
  router?.destroy();
  router = undefined;
});

describe('hash router', () => {
  it('ranks static segments above dynamic ones and reads the params of the deepest route', async () => {
    const r = await start('/items/new');
    expect(leafId(r)).toBe('new-item');
    r.navigate('/items/7/history?x=1');
    await until(() => r.location.pathname === '/items/7/history');
    expect(leafId(r)).toBe('item');
    expect(r.params).toEqual({ itemId: '7', tab: 'history' });
    expect(r.location.search).toBe('?x=1');
    expect(r.matches.map((m) => m.route.id)).toEqual(['shell', 'item']);
  });

  it('keeps the previous page until the next page module has loaded, then writes the URL', async () => {
    const slow = deferred<PageModule>();
    const r = await start('/', { slow: () => slow.promise });
    r.navigate('/slow');
    await Promise.resolve();
    expect(r.location.pathname).toBe('/');
    expect(window.location.hash).toBe('#/');
    slow.resolve({ default: Page });
    await until(() => r.location.pathname === '/slow');
    expect(window.location.hash).toBe('#/slow');
    expect(leafId(r)).toBe('slow');
  });

  it('cancels a pending navigation when a newer one starts', async () => {
    const slow = deferred<PageModule>();
    const r = await start('/', { slow: () => slow.promise });
    r.navigate('/slow');
    r.navigate('/items/3');
    await until(() => r.location.pathname === '/items/3');
    slow.resolve({ default: Page });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(r.location.pathname).toBe('/items/3');
  });

  it('pushes a history entry, but a link to the current location replaces it', async () => {
    const r = await start('/');
    const idx = () => (window.history.state as { idx: number }).idx;
    expect(idx()).toBe(0);
    r.followLink(new MouseEvent('click', { button: 0, cancelable: true }), '/items/1');
    await until(() => r.location.pathname === '/items/1');
    expect(idx()).toBe(1);
    const again = new MouseEvent('click', { button: 0, cancelable: true });
    r.followLink(again, '/items/1');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(again.defaultPrevented).toBe(true);
    expect(idx()).toBe(1);
  });

  it('leaves modified clicks and other targets to the browser', async () => {
    const r = await start('/');
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const event = new MouseEvent('click', { button: 0, cancelable: true, ...init });
      r.followLink(event, '/items/2');
      expect(event.defaultPrevented).toBe(false);
    }
    const blank = new MouseEvent('click', { button: 0, cancelable: true });
    r.followLink(blank, '/items/2', { target: '_blank' });
    expect(blank.defaultPrevented).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(r.location.pathname).toBe('/');
  });

  it('commits a navigation whose page module fails to load, with the error', async () => {
    const error = new Error('chunk failed');
    const r = await start('/', { broken: () => Promise.reject(error) });
    r.navigate('/broken');
    await until(() => r.location.pathname === '/broken');
    expect(r.failure).toEqual({ error });
    expect(r.page).toBeUndefined();
    r.navigate('/');
    await until(() => r.location.pathname === '/');
    expect(r.failure).toBeNull();
  });

  it('follows the browser history (back and forward)', async () => {
    const r = await start('/');
    r.navigate('/items/5');
    await until(() => r.location.pathname === '/items/5');
    window.history.back();
    await until(() => r.location.pathname === '/');
  });

  it('matches a hash without a leading slash like a path (the catch-all route)', async () => {
    const r = await start('nothing-here');
    expect(r.location.pathname).toBe('/nothing-here');
    expect(leafId(r)).toBe('not-found');
  });
});
