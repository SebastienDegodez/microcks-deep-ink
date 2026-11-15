import type { Clock } from '../../../application/ports/shared.js';
import { CLOCK_NOW_ISO } from './seed-ids.js';

/** Clock fixed at `2026-11-03T09:10:04Z`, so every screen shows the same "just now". */
export class FixedClock implements Clock {
  private current: number;

  constructor(iso: string = CLOCK_NOW_ISO) {
    this.current = new Date(iso).getTime();
  }

  now(): Date {
    return new Date(this.current);
  }

  /** Tests only: moves the clock forward. */
  advance(ms: number): void {
    this.current += ms;
  }
}
