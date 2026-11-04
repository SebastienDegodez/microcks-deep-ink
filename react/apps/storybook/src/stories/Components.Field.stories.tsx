import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Field } from '@microcks/deep-ink';
import { Input } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/Field',
  component: Field,
  parameters: itemParams(['field', 'input'], 'Links the visible label, help and error to the control through `id` and `aria-describedby`, and sets `aria-invalid`. The error shows an icon and text, never color alone.'),
} satisfies Meta<typeof Field>;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Field label="Service name" help="As written in the contract title.">
        {(c) => <Input {...c} defaultValue="API Pastry" />}
      </Field>
    </div>
  ),
};

export const Required: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Field label="Contract URL" required help="HTTPS URL of an OpenAPI or AsyncAPI file.">
        {(c) => <Input {...c} type="url" mono placeholder="https://example.org/openapi.yaml" />}
      </Field>
    </div>
  ),
};

export const WithError: StoryObj = {
  name: 'Error',
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Field label="Version" required error="Enter a version such as 2.0.">
        {(c) => <Input {...c} defaultValue="" />}
      </Field>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Field> = {
  args: { label: 'Service name', help: 'As written in the contract title.', error: undefined, required: false, children: (c) => <Input {...c} defaultValue="API Pastry" /> },
};
