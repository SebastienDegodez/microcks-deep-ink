import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DEEP_INK } from '@microcks-deep-ink/angular';
import { COLOR_GROUPS, RADII, SPACING, TYPE_STYLES } from '@microcks-deep-ink/storybook-shared/fixtures';

const ICONS = ['cockpit', 'apis', 'upload', 'tests', 'sources', 'usage', 'traces', 'hub', 'admin', 'plugin', 'check', 'cross', 'warning', 'running', 'circle', 'spark', 'search', 'copy', 'sun', 'moon', 'chevron', 'user'];

const meta: Meta = {
  title: 'Foundations',
  decorators: [moduleMetadata({ imports: [DEEP_INK] })],
  parameters: { controls: { disable: true } },
};
export default meta;

export const Colors: StoryObj = {
  render: () => ({
    props: { groups: COLOR_GROUPS },
    template: `
      <div class="di-page">
        <h2>Colors</h2>
        <p class="di-note">Every token has a value in both themes. Switch the theme in the toolbar: names stay, values change.</p>
        @for (g of groups; track g.title) {
          <section>
            <h3>{{ g.title }}</h3>
            <div class="di-grid">
              @for (t of g.tokens; track t) {
                <div class="di-swatch"><i [style.background]="'var(--' + t + ')'"></i><div><code>--{{ t }}</code></div></div>
              }
            </div>
          </section>
        }
      </div>`,
  }),
};

export const Typography: StoryObj = {
  render: () => ({
    props: { styles: TYPE_STYLES },
    template: `
      <div class="di-page">
        <h2>Typography</h2>
        <div>
          @for (s of styles; track s.name) {
            <div class="di-type">
              <span [style.font]="'var(--type-' + s.name + ')'" [style.letter-spacing]="s.name === 'label' ? 'var(--type-label-tracking)' : null">{{ s.sample }}</span>
              <small><code>--type-{{ s.name }}</code> · {{ s.note }}</small>
            </div>
          }
        </div>
      </div>`,
  }),
};

export const SpacingAndRadius: StoryObj = {
  name: 'Spacing & radius',
  render: () => ({
    props: { spacing: SPACING, radii: RADII },
    template: `
      <div class="di-page">
        <h2>Spacing &amp; radius</h2>
        <section>
          <h3>Spacing</h3>
          @for (s of spacing; track s) {
            <div class="di-row"><code>--{{ s }}</code><span class="di-bar" [style.width]="'var(--' + s + ')'"></span></div>
          }
        </section>
        <section>
          <h3>Radius: the shape has a meaning</h3>
          <div class="di-stack">
            @for (r of radii; track r) {
              <div class="di-col" style="align-items:center">
                <span class="di-box" [style.border-radius]="'var(--' + r + ')'"></span>
                <code style="font:var(--type-code);font-size:12px">--{{ r }}</code>
              </div>
            }
          </div>
        </section>
        <section>
          <h3>Shadows: overlays and focus only</h3>
          <div class="di-stack">
            <span class="di-box" style="box-shadow:var(--shadow-focus);border-radius:var(--radius-control)"></span>
            <span class="di-box" style="box-shadow:var(--shadow-overlay);border-radius:var(--radius-node);border:1px solid var(--border-strong)"></span>
          </div>
        </section>
      </div>`,
  }),
};

export const Icons: StoryObj = {
  render: () => ({
    props: { icons: ICONS },
    template: `
      <div class="di-page">
        <h2>Icons</h2>
        <p class="di-note">Inline stroke icons, 2px stroke, currentColor, hidden from assistive tech next to text. No emoji.</p>
        <div class="di-grid">
          @for (n of icons; track n) {
            <div class="di-swatch" style="padding:12px;display:flex;gap:10px;align-items:center">
              <mk-icon [name]="n" [size]="20"></mk-icon><code>{{ n }}</code>
            </div>
          }
        </div>
      </div>`,
  }),
};
