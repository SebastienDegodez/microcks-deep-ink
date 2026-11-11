export type ConformanceOutcome = 'pass' | 'fail' | 'untested';

/**
 * Conformance score of a service: `round(100 * pass / tested)`.
 * Returns null when no operation has been tested (the score is "unknown", not 0).
 */
export function conformanceScore(results: readonly ConformanceOutcome[]): number | null {
  const tested = results.filter((r) => r !== 'untested');
  if (tested.length === 0) return null;
  const passed = tested.filter((r) => r === 'pass').length;
  return Math.round((100 * passed) / tested.length);
}
