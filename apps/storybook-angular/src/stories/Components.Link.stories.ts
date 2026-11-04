import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { LinkComponent } from '@microcks-deep-ink/registry/angular/link';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/Link',
  argTypes: argTypesFor('link', ['LinkComponent']),
  decorators: [moduleMetadata({ imports: [LinkComponent] })],
  parameters: itemParams(['link', 'icon'], "Always underlined in body text. An external link adds an icon, a hidden \"(opens in a new tab)\" and `rel=\"noopener\"`."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
<p style="margin:0">Read the <a mkLink href="#arazzo">Arazzo specification notes</a> or the <a mkLink href="https://microcks.io" external>Microcks documentation</a>.</p>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('link', 'LinkComponent', { external: false }, 'Read the Arazzo guide');
