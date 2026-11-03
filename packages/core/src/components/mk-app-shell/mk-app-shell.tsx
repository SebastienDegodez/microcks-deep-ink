import { Component, Host, h } from '@stencil/core';

/**
 * Application frame: top bar, left nav, fluid content.
 * @slot top-bar - Usually an mk-top-bar.
 * @slot nav - Usually an mk-side-nav.
 * @slot - Page content.
 */
@Component({
  tag: 'mk-app-shell',
  shadow: true,
  styles: `
    :host { display: grid; grid-template-rows: auto 1fr; grid-template-columns: 240px 1fr; grid-template-areas: "top top" "nav main"; min-height: 100vh; background: var(--bg); color: var(--text); font: var(--type-body); }
    .top { grid-area: top; position: sticky; top: 0; z-index: 10; }
    .nav { grid-area: nav; }
    main { grid-area: main; padding: var(--space-6) var(--space-8); min-width: 0; display: flex; flex-direction: column; gap: var(--space-6); }
    @media (max-width: 767px) {
      :host { grid-template-columns: 1fr; grid-template-areas: "top" "main"; }
      .nav { display: none; }
      main { padding: var(--space-4); }
    }
  `,
})
export class MkAppShell {
  render() {
    return (
      <Host>
        <div class="top">
          <slot name="top-bar" />
        </div>
        <div class="nav">
          <slot name="nav" />
        </div>
        <main>
          <slot />
        </main>
      </Host>
    );
  }
}
