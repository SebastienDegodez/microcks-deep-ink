import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MethodTagComponent, type Protocol } from './method-tag';

export interface OpPickOption {
  id: string;
  method: string;
  protocol?: Protocol;
  path: string;
  /** Muted 12px line ("List pastries by size", "3 examples"). */
  summary?: string;
  /** Muted mono 11px line ("3 examples · +1 AI"). */
  meta?: string;
  /** End figure ("812"); `endLabel` is read before it. */
  end?: string | number;
  /** Hidden prefix of the end figure ("Calls over 7 days: "). */
  endLabel?: string;
  /** `warning` / `success`: the end is an 11px label in that colour (pending / accepted AI count). */
  endTone?: 'warning' | 'success';
}

/**
 * Operation picker: `<mk-op-pick-list label="Operations" [options]="ops" [(value)]="op" />`.
 * `mode="radio"` makes it a radiogroup with arrow keys (Copilot).
 */
@Component({
  selector: 'mk-op-pick-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MethodTagComponent, NgTemplateOutlet],
  host: { style: 'display: block' },
  template: `
    <ng-template #card let-o>
      <span mkMethodTag [method]="o.method" [protocol]="o.protocol ?? 'REST'"></span>{{ ' ' }}<span class="op-pick-main"><span class="op-pick-path">{{ o.path }}</span>@if (o.summary) {{{ ' ' }}<span class="op-pick-summary">{{ o.summary }}</span>}@if (o.meta) {{{ ' ' }}<span class="op-pick-meta">{{ o.meta }}</span>}</span>{{ ' ' }}
      @if (o.end !== undefined && o.end !== null) {
        <span class="op-pick-end" [attr.data-tone]="o.endTone ?? null">@if (o.endLabel) {<span class="sr-only">{{ o.endLabel }}</span>{{ ' ' }}}{{ o.end }}</span>
      }
    </ng-template>
    @if (mode() === 'toggle') {
      <ul class="op-pick-list" [attr.aria-label]="label() ?? null" [attr.aria-labelledby]="labelledBy() ?? null">
        @for (o of options(); track o.id) {
          <li><button type="button" class="op-pick" [attr.aria-pressed]="o.id === value()" (click)="value.set(o.id)"><ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: o }" /></button></li>
        }
      </ul>
    } @else {
      <div class="op-pick-list" role="radiogroup" [attr.aria-label]="label() ?? null" [attr.aria-labelledby]="labelledBy() ?? null">
        @for (o of options(); track o.id; let i = $index) {
          <button type="button" role="radio" class="op-pick" [attr.aria-checked]="o.id === value()" [attr.tabindex]="i === checked() ? 0 : -1" (click)="value.set(o.id)" (keydown)="onKey($event, i)"><ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: o }" /></button>
        }
      </div>
    }
  `,
})
export class OpPickListComponent {
  readonly options = input.required<OpPickOption[]>();
  /** Id of the selected operation. */
  readonly value = model<string>();
  /** `toggle` (default): list of aria-pressed buttons. `radio`: radiogroup with arrow keys. */
  readonly mode = input<'toggle' | 'radio'>('toggle');
  /** Accessible name. Or `labelledBy` with the id of a visible heading. */
  readonly label = input<string>();
  readonly labelledBy = input<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly checked = computed(() => Math.max(0, this.options().findIndex((o) => o.id === this.value())));

  protected onKey(e: KeyboardEvent, i: number): void {
    const n = this.options().length;
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (i + 1) % n
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : undefined;
    if (next === undefined) return;
    e.preventDefault();
    const o = this.options()[next];
    if (o) this.value.set(o.id);
    this.host.querySelectorAll<HTMLButtonElement>('.op-pick')[next]?.focus();
  }
}
