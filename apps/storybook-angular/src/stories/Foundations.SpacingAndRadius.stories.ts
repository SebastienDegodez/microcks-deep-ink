import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { RADII, SPACING } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Foundations/Spacing and radius',
  decorators: [moduleMetadata({ imports: [] })],
  parameters: itemParams(['tokens'], "Space follows a 4px rhythm. The shape of a corner has a meaning: controls are near-square, badges are tight, panels and nodes are rounder, only pills are round.", { controls: { disable: true } }),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { spacing: SPACING, radii: RADII },
    template: `
      <div class="sb-page">
        <section aria-labelledby="sp-spacing">
          <h3 id="sp-spacing">Spacing</h3>
          @for (s of spacing; track s) {
            <div class="sb-row"><code>--{{ s }}</code><span class="sb-bar" [style.width]="'var(--' + s + ')'" aria-hidden="true"></span></div>
          }
        </section>
        <section aria-labelledby="sp-radius">
          <h3 id="sp-radius">Radius</h3>
          <div class="sb-stack">
            @for (r of radii; track r) {
              <div class="sb-col" style="align-items:center">
                <span class="sb-box" [style.border-radius]="'var(--' + r + ')'" aria-hidden="true"></span>
                <code style="font:var(--type-code);font-size:12px">--{{ r }}</code>
              </div>
            }
          </div>
        </section>
        <section aria-labelledby="sp-shadow">
          <h3 id="sp-shadow">Shadows: overlays and focus only</h3>
          <div class="sb-stack">
            <span class="sb-box" aria-hidden="true" style="box-shadow:var(--shadow-focus);border-radius:var(--radius-control)"></span>
            <span class="sb-box" aria-hidden="true" style="box-shadow:var(--shadow-overlay);border-radius:var(--radius-node);border:1px solid var(--border-strong)"></span>
          </div>
        </section>
      </div>
    `,
  }),
};
