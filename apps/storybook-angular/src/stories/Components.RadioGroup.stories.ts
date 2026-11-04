import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CheckboxComponent, RadioComponent, RadioGroupComponent } from '@microcks-deep-ink/registry/angular/checkbox';
import { argTypesFor, itemParams } from './_meta';

const OPTIONS = [
  { value: 'mocks', label: 'Mocks', description: 'Call the Microcks mock endpoints.' },
  { value: 'implementations', label: 'Implementations', description: 'Call the real services.' },
  { value: 'mixed', label: 'Mixed', description: 'Proposed, beyond the POC.' },
];

const meta: Meta = {
  title: 'Components/Radio group',
  argTypes: argTypesFor('checkbox', ['CheckboxComponent', 'RadioComponent', 'RadioGroupComponent']),
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

export const Cards: StoryObj = {
  render: () => ({
    props: {
      mode: 'sync',
      options: [
        { value: 'sync', label: 'Keep in sync', description: 'Microcks re-imports the package when the Hub publishes a new version.' },
        { value: 'once', label: 'Import once', description: 'A one-time copy; later versions are not imported.' },
      ],
    },
    template: `<div style="max-width: 420px"><fieldset mkRadioGroup legend="Install mode" variant="card" [options]="options" [(value)]="mode"></fieldset></div>`,
  }),
};
