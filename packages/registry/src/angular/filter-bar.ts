import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent } from './icon';

let nextId = 0;

/** A named box of filter rows: `<section mkFilterBar label="Catalogue filters">`. */
@Component({
  selector: 'section[mkFilterBar]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'filter-bar', '[attr.aria-label]': 'label()' },
  template: `<ng-content />`,
})
export class FilterBarComponent {
  /** Accessible name of the region: "Catalogue filters". */
  readonly label = input.required<string>();
}

/** One row of filters. With a title it is a `role="group"` named by it: `<div mkFilterRow title="Protocol">`. */
@Component({
  selector: 'div[mkFilterRow]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'filter-bar-row',
    '[attr.role]': "title() ? 'group' : null",
    '[attr.aria-labelledby]': 'title() ? id : null',
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `@if (title()) {<span class="filter-bar-label" [id]="id">{{ title() }}</span>}<ng-content />`,
})
export class FilterRowComponent {
  /** Row title ("Protocol", "Labels"). */
  readonly title = input<string>();
  protected readonly id = `mk-filter-row-${++nextId}`;
}

/** Search field with a leading icon: `<mk-filter-search label="Search APIs" [(value)]="q" />`. */
@Component({
  selector: 'mk-filter-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  styles: [':host { display: contents; }'],
  template: `
    <label class="filter-bar-search" [attr.data-size]="size()">
      <svg mkIcon name="search" [size]="16"></svg>
      <span class="sr-only">{{ label() }}</span>
      <input type="search" [value]="value()" [attr.placeholder]="placeholder() ?? label()" (input)="value.set($any($event.target).value)" />
    </label>
  `,
})
export class FilterSearchComponent {
  /** Accessible name of the field, also its placeholder unless you set one. */
  readonly label = input.required<string>();
  readonly placeholder = input<string>();
  /** `md` is 38px high, up to 420px; `lg` is 40px, up to 480px (a page-level search, Hub). */
  readonly size = input<'md' | 'lg'>('md');
  readonly value = model('');
}

/** Link-style reset at the end of a row: `<button mkFilterReset [count]="2" (click)="reset()"></button>`. */
@Component({
  selector: 'button[mkFilterReset]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'filter-bar-reset', type: 'button', '[disabled]': 'count() === 0' },
  template: `<svg mkIcon name="reset" [size]="14"></svg>{{ label() }}@if (count() !== undefined) { ({{ count() }})}`,
})
export class FilterResetComponent {
  /** Number of active filters, written as "Reset (2)". */
  readonly count = input<number>();
  readonly label = input('Reset');
}

export const FILTER_BAR = [FilterBarComponent, FilterRowComponent, FilterSearchComponent, FilterResetComponent] as const;
