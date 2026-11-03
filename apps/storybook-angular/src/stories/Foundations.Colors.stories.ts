import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { COLOR_GROUPS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Foundations/Colors',
  decorators: [moduleMetadata({ imports: [] })],
  parameters: itemParams(['tokens'], "Every token has a value in both themes. Switch the theme in the toolbar: names stay, values change. Text roles are at least 4.5:1 and control borders at least 3:1 on every ground (enforced by the tokens contrast test).", { controls: { disable: true } }),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { groups: COLOR_GROUPS },
    template: `
      <div class="sb-page">
        @for (g of groups; track g.title) {
          <section [attr.aria-labelledby]="'colors-' + g.title">
            <h3 [id]="'colors-' + g.title">{{ g.title }}</h3>
            <div class="sb-grid">
              @for (t of g.tokens; track t) {
                <div class="sb-swatch"><i [style.background]="'var(--' + t + ')'" aria-hidden="true"></i><div><code>--{{ t }}</code></div></div>
              }
            </div>
          </section>
        }
      </div>
    `,
  }),
};
