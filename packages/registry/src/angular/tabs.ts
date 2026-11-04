import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, viewChildren } from '@angular/core';
import { IconComponent, type IconName } from './icon';

export interface TabItem {
  id: string;
  label: string;
  /** Shown after the label. Read as "Operations, 4". */
  count?: number;
  /** Warning pill after the count. Read as "Users, 2 pending changes" with `alertLabel`. */
  alert?: number;
  /** Words read after the alert number (default "need attention"). */
  alertLabel?: string;
  /** Live dot before the label. Read as "Tasks, live". */
  live?: boolean;
  /** Decorative 16px icon before the label (Import source types). */
  icon?: IconName;
  /** 12px muted text after the label, read as "Upload, one-off file". */
  hint?: string;
  disabled?: boolean;
}

let nextId = 0;

/**
 * Tabs with the WAI-ARIA tabs pattern: roving tabindex, arrow keys with wrap, Home and End.
 * Put `<div mkTabPanel tab="id">` panels inside `<mk-tabs>`.
 */
@Component({
  selector: 'mk-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'tabs', '[attr.data-variant]': "variant() === 'card' ? 'card' : null" },
  styles: [':host { display: block; }'],
  template: `
    <div role="tablist" class="tablist" [attr.aria-label]="label()">
      @for (t of items(); track t.id; let i = $index) {
        <button
          #tab
          type="button"
          role="tab"
          class="tab"
          [id]="tabId(t.id)"
          [attr.aria-selected]="i === selectedIndex()"
          [attr.aria-controls]="panelId(t.id)"
          [tabindex]="i === tabStop() ? 0 : -1"
          [disabled]="!!t.disabled"
          (click)="value.set(t.id)"
          (keydown)="onKeyDown($event, i)"
        >@if (t.live) {<span class="tab-live" aria-hidden="true"></span>}@if (t.icon) {<svg mkIcon [name]="t.icon" [size]="16"></svg>}{{ t.label }}@if (t.hint) {<span class="tab-hint"><span class="sr-only">,</span> {{ t.hint }}</span>}@if (t.live) {<span class="sr-only">, live</span>}@if (t.count !== undefined) {<span class="tab-count"><span class="sr-only">, </span>{{ t.count }}</span>}@if (t.alert) {<span class="tab-alert"><span class="sr-only">, </span>{{ t.alert }}<span class="sr-only"> {{ t.alertLabel ?? 'need attention' }}</span></span>}</button>
      }
    </div>
    <ng-content />
  `,
})
export class TabsComponent {
  /** Accessible name of the tab list. */
  readonly label = input.required<string>();
  readonly items = input.required<TabItem[]>();
  /** Id of the selected tab. */
  readonly value = model.required<string>();
  /** `automatic`: arrows select. `manual`: arrows move focus, Enter or Space selects. */
  readonly activation = input<'automatic' | 'manual'>('automatic');
  /** Prefix of the generated ids. Only needed when a panel is rendered outside `mk-tabs`. */
  readonly idPrefix = input<string>();
  /** `line` (default): the strip under a page header. `card`: at the top of a card (padding 0 8px, taller tabs that wrap). */
  readonly variant = input<'line' | 'card'>('line');

  private readonly generated = `mk-tabs-${++nextId}`;
  readonly prefix = computed(() => this.idPrefix() ?? this.generated);
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  protected readonly selectedIndex = computed(() => this.items().findIndex((t) => t.id === this.value() && !t.disabled));
  private readonly enabled = computed(() => this.items().map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0));
  /** Roving tabindex: the selected tab, or the first enabled one when nothing valid is selected. */
  protected readonly tabStop = computed(() => (this.selectedIndex() >= 0 ? this.selectedIndex() : (this.enabled()[0] ?? -1)));

  tabId(id: string): string {
    return `${this.prefix()}-tab-${id}`;
  }
  panelId(id: string): string {
    return `${this.prefix()}-panel-${id}`;
  }

  protected onKeyDown(e: KeyboardEvent, index: number): void {
    const enabled = this.enabled();
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    switch (e.key) {
      case 'ArrowRight':
        next = enabled[(pos + 1) % enabled.length];
        break;
      case 'ArrowLeft':
        next = enabled[(pos - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    if (next === undefined) return;
    e.preventDefault();
    this.tabs()[next]?.nativeElement.focus();
    const item = this.items()[next];
    if (this.activation() === 'automatic' && item) this.value.set(item.id);
  }
}

/** Panel of one tab. Only the selected panel renders its content. */
@Component({
  selector: 'div[mkTabPanel]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tabpanel',
    role: 'tabpanel',
    tabindex: '0',
    '[attr.id]': 'panelId()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[hidden]': '!active()',
  },
  template: `@if (active()) {<ng-content />}`,
})
export class TabPanelComponent {
  /** Id of the tab this panel belongs to. */
  readonly tab = input.required<string>();
  /** Overrides the selected id when the panel is rendered outside `mk-tabs`. */
  readonly value = input<string>();
  readonly idPrefix = input<string>();
  readonly active = computed(() => this.tab() === (this.value() ?? this.parent?.value()));

  private readonly parent = inject(TabsComponent, { optional: true });
  private readonly prefix = computed(() => this.idPrefix() ?? this.parent?.prefix() ?? 'di');

  protected panelId(): string {
    return `${this.prefix()}-panel-${this.tab()}`;
  }
  protected labelledBy(): string {
    return `${this.prefix()}-tab-${this.tab()}`;
  }
}

