import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SelectDirective } from '@microcks-deep-ink/registry/angular/select';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/Select',
  argTypes: argTypesFor('select', ['SelectDirective']),
  decorators: [moduleMetadata({ imports: [SelectDirective] })],
  parameters: itemParams(['select'], "The native `<select>`: the browser keeps keyboard, typeahead and the mobile picker."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:320px">
        <label class="label" for="sel-1">Dispatcher</label>
        <select mkSelect id="sel-1">
          <option value="URI_PARTS" selected>URI_PARTS</option>
          <option value="URI_PARAMS">URI_PARAMS</option>
          <option value="JSON_BODY">JSON_BODY</option>
          <option value="SCRIPT">SCRIPT</option>
        </select>
      </div>
    `,
  }),
};

export const Small: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:320px">
        <label class="label" for="sel-2">Rows per page</label>
        <select mkSelect id="sel-2" size="sm">
          <option>10</option>
          <option selected>25</option>
          <option>50</option>
        </select>
      </div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('select', 'SelectDirective', { size: 'md' }, '<option>REST</option><option>EVENT</option><option>gRPC</option>', 'aria-label="Protocol"');
