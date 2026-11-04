import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Marks a projection: a proposed feature, not available today.
 * `<span mkProjectionPill title="A2A support is a proposed protocol module for Microcks v2">Projection · v2 module</span>`.
 * The title only adds detail; the visible text must stand alone.
 */
@Component({
  selector: 'span[mkProjectionPill]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'projection-pill' },
  template: `<ng-content />`,
})
export class ProjectionPillComponent {}
