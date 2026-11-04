import { booleanAttribute, ChangeDetectionStrategy, Component, computed, Directive, input, output } from '@angular/core';
import { IconComponent, type IconName } from './icon';

export type ResultBoxTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_ICON: Record<ResultBoxTone, IconName | undefined> = {
  success: 'check',
  warning: 'warning',
  danger: 'x-circle',
  neutral: 'warning',
  info: undefined,
};

/** The end slot: `<span mkResultBoxAction><button mkButton size="sm">Undo</button></span>`. Same class as React's `action` wrapper. */
@Directive({ selector: '[mkResultBoxAction]', host: { class: 'result-box-action' } })
export class ResultBoxActionDirective {}

/**
 * A framed result line in a `role="status"` box: `<div mkResultBox tone="success">Secret created.</div>`.
 * Project buttons or links for the end with `[mkResultBoxAction]`. Keep it mounted before the result arrives.
 */
@Component({
  selector: 'div[mkResultBox]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    class: 'result-box',
    '[attr.role]': "live() === 'status' ? 'status' : null",
    '[attr.data-tone]': "tone() === 'success' ? null : tone()",
    '[attr.data-size]': "size() === 'md' ? 'md' : null",
    '[attr.data-bordered]': "bordered() ? null : 'false'",
    '[attr.data-surface]': "surface() === 'surface' ? null : surface()",
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    @if (iconName(); as name) {<span class="result-box-icon" aria-hidden="true"><svg mkIcon [name]="name" [size]="15"></svg></span>}
    <div class="result-box-body">
      @if (title()) {<p class="result-box-title">{{ title() }}</p>}
      <span><ng-content /></span>
    </div>
    <ng-content select="[mkResultBoxAction]" />
    @if (dismissible()) {
      <button type="button" class="result-box-dismiss" [attr.aria-label]="dismissLabel()" (click)="dismiss.emit()"><svg mkIcon name="close" [size]="14"></svg></button>
    }
  `,
})
export class ResultBoxComponent {
  /** `success` (default), `warning`, `danger`, `neutral` (thin frame on --bg), `info` (strong frame on --raised). */
  readonly tone = input<ResultBoxTone>('success');
  /** `md`: 14px text in --text (toast). */
  readonly size = input<'sm' | 'md'>('sm');
  /** Bold 14px first line. */
  readonly title = input<string>();
  /** Leading decorative icon. Defaults to the tone's icon; `null` hides it. */
  readonly icon = input<IconName | null | undefined>(undefined);
  /** Shows a 28px dismiss button that emits `dismiss`. */
  readonly dismissible = input(false);
  readonly dismissLabel = input('Dismiss message');
  /** `status` (default) is a polite live region; `off` for static content. */
  readonly live = input<'status' | 'off'>('status');
  /** Default `true`. `false`: no frame, a top-aligned note layout (gap 10, 15px icon offset 3px with a 2.6 stroke, title in normal line height, 13px/1.55 text up to 80ch), as the Agent test verdict. */
  readonly bordered = input(true, { transform: booleanAttribute });
  /** Default `surface`. `raised`: the --raised fill instead of --surface (Agent test verdict). */
  readonly surface = input<'surface' | 'raised'>('surface');
  readonly dismiss = output<void>();

  protected readonly iconName = computed(() => {
    const icon = this.icon();
    return icon === null ? undefined : (icon ?? TONE_ICON[this.tone()]);
  });
}

export const RESULT_BOX = [ResultBoxComponent, ResultBoxActionDirective] as const;
