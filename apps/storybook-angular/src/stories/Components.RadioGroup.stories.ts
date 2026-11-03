import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CheckboxComponent, RadioComponent, RadioGroupComponent } from '@microcks-deep-ink/registry/angular/checkbox';
import { itemParams } from './_meta';

const OPTIONS = [
  { value: 'mocks', label: 'Mocks', description: 'Call the Microcks mock endpoints.' },
  { value: 'implementations', label: 'Implementations', description: 'Call the real services.' },
  { value: 'mixed', label: 'Mixed', description: 'Proposed, beyond the POC.' },
];

const meta: Meta = {
  title: 'Components/Radio group',
  decorators: [moduleMetadata({ imports: [CheckboxComponent, RadioComponent, RadioGroupComponent] })],
  parameters: itemParams(['checkbox'], "A `<fieldset>` with a `<legend>`: the group name is read before each option. Arrow keys move and select, as native radios do."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { options: OPTIONS, v: 'mocks' as string | undefined },
    template: `
<fieldset mkRadioGroup legend="Run against" [options]="options" [(value)]="v"></fieldset>
    `,
  }),
};

export const WithError: StoryObj = {
  name: "Error",
  render: () => ({
    props: { options: OPTIONS, v: undefined as string | undefined },
    template: `
<fieldset mkRadioGroup legend="Run against" required [options]="options" [(value)]="v" error="Choose what the workflow runs against."></fieldset>
    `,
  }),
};
