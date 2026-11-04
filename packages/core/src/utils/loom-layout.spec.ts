import { describe, expect, it } from 'vitest';
import { layoutLoom, loomGrid } from './loom-layout';
import type { LoomSource, LoomStep } from './types';

const rest: LoomSource = { name: 'apiPastry', type: 'openapi', protocol: 'REST', linked: true };
const events: LoomSource = { name: 'pastryOrders', type: 'asyncapi', protocol: 'EVENT', linked: true };
const step = (stepId: string, extra: Partial<LoomStep> = {}): LoomStep => ({
  stepId,
  source: 'apiPastry',
  operation: 'GET /pastries',
  ...extra,
});

describe('layoutLoom', () => {
  it('is sequential when no step declares dependsOn', () => {
    const l = layoutLoom([step('a'), step('b'), step('c', { source: 'pastryOrders' })], [rest, events]);
    expect(l.placements.map((p) => [p.stepId, p.column, p.lane, p.row])).toEqual([
      ['a', 0, 0, 0],
      ['b', 1, 0, 0],
      ['c', 2, 1, 0],
    ]);
    expect(l.edges).toEqual([
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ]);
    expect(l.columns).toBe(3);
    expect(l.laneRows).toEqual([1, 1]);
    expect(l.warnings).toEqual([]);
  });

  it('draws the check-menu as three parallel branches joining at compareSizes', () => {
    const l = layoutLoom(
      [
        step('getSmall', { dependsOn: [] }),
        step('getMedium'),
        step('getLarge'),
        step('compareSizes', { dependsOn: ['getSmall', 'getMedium', 'getLarge'] }),
      ],
      [rest],
    );
    const by = Object.fromEntries(l.placements.map((p) => [p.stepId, p]));
    expect([by.getSmall?.column, by.getMedium?.column, by.getLarge?.column]).toEqual([0, 0, 0]);
    expect([by.getSmall?.row, by.getMedium?.row, by.getLarge?.row]).toEqual([0, 1, 2]);
    expect(by.compareSizes?.column).toBe(1);
    expect(l.laneRows).toEqual([3]);
    expect(l.edges.filter((e) => e.to === 'compareSizes').map((e) => e.from)).toEqual(['getSmall', 'getMedium', 'getLarge']);
    expect(l.columns).toBe(2);
  });

  it('uses the longest path for the column', () => {
    const l = layoutLoom(
      [step('a', { dependsOn: [] }), step('b', { dependsOn: ['a'] }), step('c', { dependsOn: ['a', 'b'] })],
      [rest],
    );
    expect(l.placements.map((p) => p.column)).toEqual([0, 1, 2]);
  });

  it('ignores an unknown dependsOn and warns', () => {
    const l = layoutLoom([step('a', { dependsOn: ['ghost'] }), step('b', { dependsOn: ['a'] })], [rest]);
    expect(l.placements.map((p) => p.column)).toEqual([0, 1]);
    expect(l.edges).toEqual([{ from: 'a', to: 'b' }]);
    expect(l.warnings).toHaveLength(1);
    expect(l.warnings[0]).toContain('unknown step "ghost"');
  });

  it('survives a dependency cycle and a self dependency', () => {
    const l = layoutLoom([step('a', { dependsOn: ['b'] }), step('b', { dependsOn: ['a', 'b'] })], [rest]);
    expect(l.placements).toHaveLength(2);
    expect(l.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('adds a lane for an undeclared source', () => {
    const l = layoutLoom([step('a', { source: 'other' })], [rest]);
    expect(l.placements[0]?.lane).toBe(1);
    expect(l.laneRows).toEqual([1, 1]);
    expect(l.warnings[0]).toContain('"other"');
  });

  it('handles an empty workflow', () => {
    const l = layoutLoom([], []);
    expect(l.columns).toBe(0);
    expect(l.placements).toEqual([]);
  });
});

describe('loomGrid', () => {
  it('places the six column centres of a four-step workflow like the prototype', () => {
    const g = loomGrid(4);
    expect([0, 1, 2, 3, 4, 5].map((c) => g.pct(g.centre(c)))).toEqual(['7.76%', '24.14%', '41.38%', '58.62%', '75.86%', '92.24%']);
    expect(g.pct(g.centre(2) + 0.3)).toBe('46.55%');
    expect(g.pct(g.centre(3) + 0.08)).toBe('60.00%');
    expect(g.pct(0.9)).toBe('15.52%');
    expect(g.template).toBe('minmax(0, 0.9fr) repeat(4, minmax(0, 1fr)) minmax(0, 0.9fr)');
  });

  it('keeps one step column when there is no step', () => {
    const g = loomGrid(0);
    expect(g.steps).toBe(1);
    expect(g.pct(g.centre(2))).toBe('83.93%');
  });
});
