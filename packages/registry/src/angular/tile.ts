import { booleanAttribute, ChangeDetectionStrategy, Component, contentChild, Directive, input, output } from '@angular/core';

let nextId = 0;

/** Logo, icon or picture before the title: `<span mkTileMedia>…</span>`. */
@Directive({ selector: '[mkTileMedia]', host: { class: 'tile-media' } })
export class TileMediaDirective {}

/** One line under the title: `<span mkTileMeta>maintained by community · 3 APIs</span>`. */
@Directive({ selector: '[mkTileMeta]', host: { class: 'tile-meta' } })
export class TileMetaDirective {}

/** End of the header: a category tag (`<span class="tile-tag">`), a status. */
@Directive({ selector: '[mkTileAside]', host: { class: 'tile-aside' } })
export class TileAsideDirective {}

/** Footer row: actions and, in `<span class="tile-footer-end">`, totals. */
@Directive({ selector: '[mkTileFooter]', host: { class: 'tile-footer' } })
export class TileFooterDirective {}

/**
 * Your own title link, for router links: `<a mkTileAction routerLink="/hub/banking">Open Banking</a>`.
 * It replaces `href` / `select` and is stretched over the tile.
 */
@Directive({ selector: 'a[mkTileAction], button[mkTileAction]', host: { class: 'tile-action' } })
export class TileActionDirective {}

/**
 * Card for a package, a service, a workflow or an agent. The whole tile is clickable through one real link or
 * button (the title) stretched over it; other controls in the footer stay separate and keyboard reachable.
 * `<article mkTile title="Open Banking" href="#/hub/banking">…</article>`
 */
@Component({
  selector: 'article[mkTile], li[mkTile], div[mkTile]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tile',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.data-interactive]': "interactive() ? '' : null",
    '[attr.data-selected]': "selected() ? '' : null",
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    <div class="tile-head">
      <ng-content select="[mkTileMedia]" />
      <div class="tile-heading">
        <div class="tile-title" role="heading" [attr.aria-level]="headingLevel()">
          @if (customAction()) {
            <span [id]="titleId"><ng-content select="[mkTileAction]" /></span>
          } @else if (href()) {
            <a class="tile-action" [id]="titleId" [attr.href]="href()" [attr.aria-current]="selected() ? 'true' : null">{{ title() }}</a>
          } @else if (selectable()) {
            <button type="button" class="tile-action" [id]="titleId" [attr.aria-pressed]="selected() ? 'true' : 'false'" (click)="tileSelect.emit()">{{ title() }}</button>
          } @else {
            <span [id]="titleId">{{ title() }}</span>
          }
        </div>
        <ng-content select="[mkTileMeta]" />
      </div>
      <ng-content select="[mkTileAside]" />
    </div>
    <div class="tile-body"><ng-content /></div>
    <ng-content select="[mkTileFooter]" />
  `,
})
export class TileComponent {
  /** Visible name. It names the tile and, when the tile is interactive, it is the one link or button. */
  readonly title = input<string>('');
  /** Level of the title heading. Keep the page outline ordered. */
  readonly headingLevel = input<2 | 3 | 4 | 5 | 6>(3);
  /** The title becomes a link stretched over the tile. */
  readonly href = input<string>();
  /** The title becomes a toggle button stretched over the tile (`aria-pressed` follows `selected`). */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Selected tile: action border and selected fill; the link gets `aria-current`, the button `aria-pressed`. */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Emitted when the title button of a `selectable` tile is activated. */
  readonly tileSelect = output<void>();

  protected readonly customAction = contentChild(TileActionDirective);
  protected readonly titleId = `mk-tile-title-${++nextId}`;

  protected interactive(): boolean {
    return Boolean(this.customAction() || this.href() || this.selectable());
  }
}

/** Wrapping grid of tiles, 12px apart, each tile at least 300px wide: `<section mkTileGrid label="Packages">`. */
@Component({
  selector: 'section[mkTileGrid], ul[mkTileGrid], div[mkTileGrid]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tile-grid', '[attr.aria-label]': 'label()' },
  template: `<ng-content />`,
})
export class TileGridComponent {
  /** Accessible name of the group: "Packages". */
  readonly label = input.required<string>();
}

export const TILE = [TileComponent, TileGridComponent, TileMediaDirective, TileMetaDirective, TileAsideDirective, TileFooterDirective, TileActionDirective] as const;
