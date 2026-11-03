import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CheckboxComponent, RadioComponent, RadioGroupComponent } from '@microcks-deep-ink/registry/angular/checkbox';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Checkbox',
  decorators: [moduleMetadata({ imports: [CheckboxComponent, RadioComponent, RadioGroupComponent] })],
  parameters: itemParams(['checkbox'], "A native checkbox inside its label. The description is linked with `aria-describedby`."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { on: true },
    template: `
<mk-checkbox label="Validate responses against the schema" [(checked)]="on" />
    `,
  }),
};

export const WithDescription: StoryObj = {
  render: () => ({
    template: `
<mk-checkbox label="Run on every import" description="Triggers a conformance test whenever the contract changes." [checked]="true" />
    `,
  }),
};

export const Disabled: StoryObj = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-checkbox label="Disabled, unchecked" disabled />
        <mk-checkbox label="Disabled, checked" disabled [checked]="true" />
      </div>
    `,
  }),
};
