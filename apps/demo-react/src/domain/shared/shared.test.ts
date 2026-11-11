import { describe, expect, it } from 'vitest';
import { conformanceScore } from '@microcks/demo-core/domain/shared/conformance';
import { formatClock, formatDuration, formatRelative } from '@microcks/demo-core/domain/shared/time';
import { labelFromString, labelToString } from '@microcks/demo-core/domain/shared/service';

describe('conformanceScore', () => {
  it('is round(100 * pass / tested)', () => {
    expect(conformanceScore(['pass', 'pass', 'fail'])).toBe(67);
    expect(conformanceScore(['pass', 'fail', 'fail'])).toBe(33);
    expect(conformanceScore(['pass', 'pass', 'pass', 'fail'])).toBe(75);
  });

  it('ignores untested operations', () => {
    expect(conformanceScore(['pass', 'untested', 'untested'])).toBe(100);
  });

  it('is null when nothing is tested (unknown, not zero)', () => {
    expect(conformanceScore([])).toBeNull();
    expect(conformanceScore(['untested', 'untested'])).toBeNull();
  });
});

describe('formatRelative', () => {
  const now = '2026-11-03T09:10:04Z';
  it.each([
    ['2026-11-03T09:10:00Z', 'just now'],
    ['2026-11-03T08:25:04Z', '45 min ago'],
    ['2026-11-03T07:10:04Z', '2 h ago'],
    ['2026-11-02T08:00:04Z', 'yesterday'],
    ['2026-10-31T08:00:04Z', '3 d ago'],
    ['2026-10-20T08:00:04Z', '2 wk ago'],
    ['2026-08-03T08:00:04Z', '3 mo ago'],
  ])('%s -> %s', (date, expected) => {
    expect(formatRelative(now, date)).toBe(expected);
  });

  it('clamps dates in the future to "just now"', () => {
    expect(formatRelative(now, '2026-11-03T09:14:37Z')).toBe('just now');
  });
});

describe('formatting helpers', () => {
  it('formats the run clock in UTC', () => {
    expect(formatClock('2026-11-03T09:10:04Z')).toBe('Nov 3, 2026 09:10:04');
  });
  it('formats durations', () => {
    expect(formatDuration(212)).toBe('212 ms');
    expect(formatDuration(5400)).toBe('5.40 s');
  });
  it('round-trips labels', () => {
    expect(labelToString(labelFromString('domain=pastry'))).toBe('domain=pastry');
  });
});
