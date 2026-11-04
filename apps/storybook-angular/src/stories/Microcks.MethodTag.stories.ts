import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MethodTagComponent } from '@microcks-deep-ink/registry/angular/method-tag';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/MethodTag',
  argTypes: argTypesFor('method-tag', ['MethodTagComponent']),
  decorators: [moduleMetadata({ imports: [MethodTagComponent] })],
  parameters: itemParams(['method-tag'], "The operation verb in mono, always written out. The color only speeds up scanning."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    template: `
      <div class="inline">
        @for (m of methods; track m) {
          <span mkMethodTag [method]="m"></span>
        }
        <span mkMethodTag method="SUBSCRIBE" protocol="EVENT"></span>
        <span mkMethodTag method="PUBLISH" protocol="EVENT"></span>
      </div>
    `,
  }),
};

export const AlignedInAList: StoryObj = {
  name: 'Aligned in a list',
  render: () => ({
    props: { ops: [['GET', '/pastries'], ['PATCH', '/pastries/{name}'], ['DELETE', '/pastries/{name}']] },
    template: `
      <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px">
        @for (o of ops; track o[0]) {
          <li style="display: flex; gap: 10px; align-items: center"><span mkMethodTag [method]="o[0]" [minWidth]="52"></span><span style="font-family: var(--font-mono); font-size: 13px">{{ o[1] }}</span></li>
        }
      </ul>
    `,
  }),
};

export const Small: StoryObj = {
  name: 'Small and extra small',
  render: () => ({
    template: `
      <div class="inline">
        <span mkMethodTag method="GET" size="sm"></span>
        <span mkMethodTag method="PATCH" size="sm"></span>
        <span mkMethodTag method="POST" size="sm"></span>
        <span mkMethodTag method="GET" size="xs"></span>
        <span mkMethodTag method="PATCH" size="xs"></span>
      </div>
    `,
  }),
};
