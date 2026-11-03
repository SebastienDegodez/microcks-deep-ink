import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DescriptionListComponent } from '@microcks-deep-ink/registry/angular/description-list';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/DescriptionList',
  decorators: [moduleMetadata({ imports: [DescriptionListComponent] })],
  parameters: itemParams(['description-list'], "A native `<dl>`: terms and values are paired for assistive technology."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      items: [
        { term: 'Service', value: 'API Pastry' },
        { term: 'Version', value: '2.0', mono: true },
        { term: 'Type', value: 'REST' },
        { term: 'Mock URL', value: 'http://microcks.local:8080/rest/API+Pastry/2.0', mono: true },
      ],
    },
    template: `
<dl mkDescriptionList style="max-width:520px;display:block" [items]="items"></dl>
    `,
  }),
};
