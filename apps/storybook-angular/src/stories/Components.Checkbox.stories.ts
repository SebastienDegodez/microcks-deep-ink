import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CheckboxComponent, RadioComponent, RadioGroupComponent } from '@microcks-deep-ink/registry/angular/checkbox';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/Checkbox',
  argTypes: argTypesFor('checkbox', ['CheckboxComponent', 'RadioComponent', 'RadioGroupComponent']),
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
      <div class="stack">
        <mk-checkbox label="Disabled, unchecked" disabled />
        <mk-checkbox label="Disabled, checked" disabled [checked]="true" />
      </div>
    `,
  }),
};

export const CompactCards: StoryObj = {
  name: 'Compact cards (dense list)',
  render: () => ({
    props: { a: true, b: true, c: false },
    template: `
<div style="display: flex; flex-direction: column; gap: 6px; max-width: 360px">
  <mk-checkbox variant="compact" label="GET /pastries" [(checked)]="a" />
  <mk-checkbox variant="compact" label="GET /pastries/&#123;name&#125;" [(checked)]="b" />
  <mk-checkbox variant="compact" label="PATCH /pastries/&#123;name&#125;" [(checked)]="c" />
</div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('checkbox', 'CheckboxComponent', { label: 'Run on every push', description: 'The test starts from your CI pipeline.', variant: 'plain', disabled: false }, '');
