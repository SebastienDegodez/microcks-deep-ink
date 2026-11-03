import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CodeBlockComponent } from '@microcks-deep-ink/registry/angular/code-block';
import { RUN14_FAILURE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/CodeBlock',
  decorators: [moduleMetadata({ imports: [CodeBlockComponent] })],
  parameters: itemParams(['code-block', 'copy-button'], "A `<figure>` with a focusable `<pre>` so keyboard users can scroll it. A bad line has a \"\u2715\" marker and a visible note, not color alone."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { code: '{\n  "name": "Millefeuille",\n  "price": 3.9\n}' },
    template: `
      <div style="max-width:640px">
        <figure mkCodeBlock caption="Mock response" language="json" [code]="code"></figure>
      </div>
    `,
  }),
};

export const WithBadLine: StoryObj = {
  name: "Failing line",
  render: () => ({
    props: { failure: RUN14_FAILURE },
    template: `
      <div style="max-width:640px">
        <figure mkCodeBlock [caption]="failure.request + ' · response'" language="json" [lines]="failure.response"></figure>
      </div>
    `,
  }),
};

export const Scrolling: StoryObj = {
  render: () => ({
    props: { code: 'curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -H "Content-Type: application/json" -d \'{"price": 3.9}\'' },
    template: `
      <div style="max-width:360px">
        <figure mkCodeBlock caption="Long line" [copy]="false" maxHeight="120px" [code]="code"></figure>
      </div>
    `,
  }),
};
