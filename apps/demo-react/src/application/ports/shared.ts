/** Time source. In the demo it is fixed at `2026-11-03T09:10:04Z`. */
export interface Clock {
  now(): Date;
}
