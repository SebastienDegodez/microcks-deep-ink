import type { IconName } from '../../types.js';
import type { CheckResult } from '../types.js';
export const MATRIX_RESULT: Record<CheckResult, { word: string; icon: IconName }> = {
  pass: { word: 'Passed', icon: 'check' }, fail: { word: 'Failed', icon: 'cross' },
  warn: { word: 'Warning', icon: 'warning' }, running: { word: 'Running', icon: 'running' }, queued: { word: 'Queued', icon: 'circle' },
};
