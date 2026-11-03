import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { TYPE_STYLES } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Foundations/Typography',
  decorators: [moduleMetadata({ imports: [] })],
  parameters: itemParams(['tokens'], "Type roles are CSS shorthands (`font: var(--type-body)`). Sizes are in px for the specimen; use rem in product code so the text follows the user setting.", { controls: { disable: true } }),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { styles: TYPE_STYLES },
    template: `
      <div class="sb-page">
        <div>
          @for (s of styles; track s.name) {
            <div class="sb-type">
              <span [style.font]="'var(--type-' + s.name + ')'" [style.letter-spacing]="s.name === 'label' ? 'var(--type-label-tracking)' : null">{{ s.sample }}</span>
              <small><code>--type-{{ s.name }}</code> · {{ s.note }}</small>
            </div>
          }
        </div>
      </div>
    `,
  }),
};
