import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { InputDirective } from '@microcks-deep-ink/registry/angular/input';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Input',
  argTypes: argTypesFor('input', ['InputDirective']),
  decorators: [moduleMetadata({ imports: [InputDirective] })],
  parameters: itemParams(['input'], "Native `<input>` and `<textarea>`. The border uses `--border-control` (3:1 against every ground). Always pair with a visible label, see Field."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:420px">
        <label class="label" for="in-1">Search services</label>
        <input mkInput id="in-1" placeholder="API Pastry" />
      </div>
    `,
  }),
};

/** `size="sm"` for dense toolbars; `surface="bg"` on a field that sits on a panel. */
export const Small: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:360px">
        <input mkInput size="sm" aria-label="Filter, small" placeholder="Small input" />
        <input mkInput surface="bg" aria-label="Filter, page background" placeholder="Background surface" />
        <textarea mkInput size="sm" surface="bg" aria-label="Notes, small" placeholder="Small textarea" rows="3"></textarea>
      </div>
    `,
  }),
};

export const Mono: StoryObj = {
  render: () => ({
    props: { path: '/pastries/{name}' },
    template: `
      <div class="stack" style="max-width:420px">
        <label class="label" for="in-2">Operation path</label>
        <input mkInput id="in-2" mono [value]="path" />
      </div>
    `,
  }),
};

export const Invalid: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:420px">
        <label class="label" for="in-3">Port</label>
        <input mkInput id="in-3" aria-invalid="true" aria-describedby="in-3-e" value="80a" />
        <p class="error" id="in-3-e"><span class="sr-only">Error: </span>The port must be a number.</p>
      </div>
    `,
  }),
};

export const Multiline: StoryObj = {
  render: () => ({
    props: { payload: '{\n  "name": "Millefeuille"\n}' },
    template: `
      <div class="stack" style="max-width:420px">
        <label class="label" for="in-4">Payload</label>
        <textarea mkInput id="in-4" mono rows="4" [value]="payload"></textarea>
      </div>
    `,
  }),
};

export const Disabled: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:420px">
        <label class="label" for="in-5">Dispatcher</label>
        <input mkInput id="in-5" disabled value="URI_PARTS" />
      </div>
    `,
  }),
};

export const OnPageBackground: StoryObj = {
  name: 'On the page background',
  render: () => ({
    template: `
      <div class="stack" style="max-width:420px">
        <label class="label" for="in-bg">Repository URL</label>
        <input mkInput id="in-bg" mono surface="bg" value="https://gitlab.acme.io/bakery/pastry-api.git" />
      </div>
    `,
  }),
};
