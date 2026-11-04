import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { FieldComponent } from '@microcks-deep-ink/registry/angular/field';
import { InputDirective } from '@microcks-deep-ink/registry/angular/input';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Field',
  argTypes: argTypesFor('field', ['FieldComponent']),
  decorators: [moduleMetadata({ imports: [FieldComponent, InputDirective] })],
  parameters: itemParams(['field', 'input'], "Links the visible label, help and error to the control through `id` and `aria-describedby`, and sets `aria-invalid`. The error shows an icon and text, never color alone."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div style="max-width:420px">
        <mk-field label="Service name" help="As written in the contract title."><input mkInput value="API Pastry" /></mk-field>
      </div>
    `,
  }),
};

export const Required: StoryObj = {
  render: () => ({
    template: `
      <div style="max-width:420px">
        <mk-field label="Contract URL" required help="HTTPS URL of an OpenAPI or AsyncAPI file."><input mkInput type="url" mono placeholder="https://example.org/openapi.yaml" /></mk-field>
      </div>
    `,
  }),
};

export const WithError: StoryObj = {
  name: "Error",
  render: () => ({
    template: `
      <div style="max-width:420px">
        <mk-field label="Version" required error="Enter a version such as 2.0."><input mkInput value="" /></mk-field>
      </div>
    `,
  }),
};
