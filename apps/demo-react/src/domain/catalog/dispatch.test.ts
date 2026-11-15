import { describe, expect, it } from 'vitest';
import { scriptSample, storedAs, storedSummary } from '@microcks/demo-core/domain/catalog/dispatch';
import type { Behavior } from '@microcks/demo-core/domain/catalog/types';

const base: Behavior = { dispatcher: 'URI_PARTS', rule: 'name', delayMs: 0, constraints: [], stateful: false };

describe('storedSummary (Saved strip)', () => {
  it('reads like Stored as, on one line, for every dispatcher', () => {
    expect(storedSummary(base)).toBe('URI_PARTS · rule: name');
    expect(storedSummary({ ...base, dispatcher: 'URI_PARAMS', rule: 'size' })).toBe('URI_PARAMS · rule: size');
    const script = { ...base, dispatcher: 'SCRIPT' as const, scriptLanguage: 'GROOVY' as const, script: scriptSample('GROOVY', false) };
    expect(storedSummary(script)).toBe('GROOVY · <script, 10 lines>');
    expect(storedAs(script)).toContain('GROOVY');
    const json = { ...base, dispatcher: 'JSON_BODY' as const, rule: JSON.stringify({ exp: '/name', operator: 'equals', cases: { 'Eclair Cafe': 'Eclair Cafe', default: 'Millefeuille' } }, null, 2) };
    expect(storedSummary(json)).toBe('JSON_BODY · /name, 2 cases');
    expect(storedSummary(json)).not.toContain('\n');
    expect(storedSummary({ ...base, dispatcher: 'FALLBACK', fallback: 'Millefeuille' })).toBe('FALLBACK · URI_PARTS name → Millefeuille');
    expect(storedSummary({ ...base, dispatcher: 'PROXY_FALLBACK', proxyUrl: 'https://x' })).toBe('PROXY_FALLBACK · URI_PARTS name → proxyUrl');
  });
});
