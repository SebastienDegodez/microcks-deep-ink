import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SwitchComponent } from '@microcks-deep-ink/registry/angular/switch';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Switch',
  argTypes: argTypesFor('switch', ['SwitchComponent']),
  decorators: [moduleMetadata({ imports: [SwitchComponent] })],
  parameters: itemParams(['switch'], "A native checkbox with `role=\"switch\"`. The state is the checked state: the track also shows a mark, so it is not color only."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { on: true },
    template: `
<mk-switch label="Schema validation" [(checked)]="on" />
    `,
  }),
};

export const WithDescription: StoryObj = {
  render: () => ({
    props: { on: false },
    template: `
<mk-switch label="Record traffic" description="Keeps the last 1,000 calls for replay." [(checked)]="on" />
    `,
  }),
};

export const Disabled: StoryObj = {
  render: () => ({
    template: `
<mk-switch label="Managed by your administrator" [checked]="true" disabled />
    `,
  }),
};

export const Large: StoryObj = {
  render: () => ({
    props: { on: true },
    template: `
<mk-switch label="Stateful" size="lg" [(checked)]="on" />
    `,
  }),
};
