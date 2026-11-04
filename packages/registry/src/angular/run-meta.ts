import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type RunMetaKind = 'text' | 'mono' | 'url' | 'chip';

export interface RunMetaItem {
  term: string;
  value: string;
  /** `mono` (durations), `url` (mono, link colour), `chip` (runner name). */
  kind?: RunMetaKind;
  /** Muted mono 12px detail after the value: the absolute date after "just now". */
  detail?: string;
}

/**
 * The meta line under a run header: `<dl mkRunMeta [items]="meta"></dl>`. For rich values (a real link),
 * project your own `<div class="run-meta-item"><dt>…</dt><dd data-kind="url"><a href>…</a></dd></div>`.
 */
@Component({
  selector: 'dl[mkRunMeta]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'run-meta' },
  template: `@for (it of items(); track $index) {<div class="run-meta-item"><dt>{{ it.term }}</dt><dd [attr.data-kind]="it.kind && it.kind !== 'text' ? it.kind : null">{{ it.value }}</dd>@if (it.detail) {<dd class="run-meta-detail">{{ it.detail }}</dd>}</div>}<ng-content />`,
})
export class RunMetaComponent {
  readonly items = input<RunMetaItem[]>([]);
}
