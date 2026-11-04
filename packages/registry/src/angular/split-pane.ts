import { Directive, input } from '@angular/core';

/**
 * List + detail layout: `<div mkSplitPane><nav mkSplitPaneSide aria-label="Operations">…</nav><section mkSplitPaneMain>…</section></div>`.
 * Keep the panes in reading order in the DOM.
 */
@Directive({
  selector: '[mkSplitPane]',
  host: {
    class: 'split-pane',
    '[attr.data-align]': "align() === 'stretch' ? 'stretch' : null",
    '[attr.data-balanced]': "balanced() ? '' : null",
    '[style.--split-side]': 'sideWidth() ?? null',
    '[style.--split-side-max]': 'sideMax() ?? null',
    '[style.--split-main]': 'mainWidth() ?? null',
    '[style.--split-gap]': 'gap() ?? null',
  },
})
export class SplitPaneDirective {
  /** Starting width of the side pane (260px). */
  readonly sideWidth = input<string>();
  /** Cap of the side pane (360px); `none` lets it grow. */
  readonly sideMax = input<string>();
  /** Starting width of the main pane (520px). */
  readonly mainWidth = input<string>();
  /** Gap between the panes (20px). */
  readonly gap = input<string>();
  /** `stretch`: both panes as tall as the taller one. */
  readonly align = input<'start' | 'stretch'>('start');
  /** Both panes grow alike instead of the main pane taking the rest (Sources). */
  readonly balanced = input(false);
}

/** The narrow pane (list, rail, filters). */
@Directive({ selector: '[mkSplitPaneSide]', host: { class: 'split-pane-side' } })
export class SplitPaneSideDirective {}

/** The wide pane (detail). */
@Directive({ selector: '[mkSplitPaneMain]', host: { class: 'split-pane-main' } })
export class SplitPaneMainDirective {}

export const SPLIT_PANE = [SplitPaneDirective, SplitPaneSideDirective, SplitPaneMainDirective] as const;
