// Self-test of the Svelte half of the parity harness, on a fixture component and hand-written "React" markup.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import Counter from '../fixtures/Counter.svelte';
import { parity, parityItems, svelteHtml } from './parity';

const dir = mkdtempSync(join(__dirname, '..', '..', '.parity-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'counter.cases.json'), JSON.stringify({ component: 'Counter', cases: [{ name: 'default', props: { label: 'Clicks' } }] }));
writeFileSync(join(dir, 'counter.default.html'), '<button class="btn" type="button" aria-pressed="false">Clicks: 0</button>');

describe('parity harness', () => {
  it('reads the cases files', () => {
    expect(parityItems(dir)).toEqual([{ item: 'counter', component: 'Counter', cases: [{ name: 'default', props: { label: 'Clicks' } }] }]);
  });

  it('renders a case with svelte/server and matches the React markup once normalised', () => {
    expect(svelteHtml(Counter, { name: 'raw' })).toContain('<!--');
    const [c] = parityItems(dir)[0]!.cases;
    const { svelte, react } = parity(Counter, 'counter', c!, dir);
    expect(svelte).toBe(react);
    expect(parity(Counter, 'counter', { name: 'default', props: { label: 'Other' } }, dir).svelte).not.toBe(react);
  });
});
