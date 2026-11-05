import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CodeBlockComponent } from '@microcks-deep-ink/registry/angular/code-block';
import { RUN14_FAILURE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/CodeBlock',
  argTypes: argTypesFor('code-block', ['CodeBlockComponent']),
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

export const FormatTabs: StoryObj = {
  name: "Format tabs",
  render: () => ({
    props: {
      tab: 'curl',
      tabs: [{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }],
      snippets: {
        curl: "curl -X GET 'http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille'",
        httpie: 'http GET http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille',
      },
    },
    template: `<figure mkCodeBlock language="shell" [tabs]="tabs" [(tab)]="tab" [code]="snippets[tab]"></figure>`,
  }),
};

export const Plain: StoryObj = {
  render: () => ({
    props: { code: '{"dispatcher": "URI_PARTS", "dispatcherRules": "name"}' },
    template: `<figure mkCodeBlock variant="plain" caption="Stored as" [code]="code"></figure>`,
  }),
};

export const Numbered: StoryObj = {
  name: "Line numbers and inline note",
  render: () => ({
    props: { lines: [{ text: '{' }, { text: '  "name": "Eclair Cafe",' }, { text: '  "price": "2.5"', bad: true, note: 'schema: number' }, { text: '}' }] },
    template: `<figure mkCodeBlock variant="plain" caption="Response body" lineNumbers [lines]="lines"></figure>`,
  }),
};

export const ChangedLines: StoryObj = {
  name: 'Changed lines (diff)',
  render: () => ({
    props: {
      tabs: [{ id: 'gh', label: 'GitHub Actions' }, { id: 'gl', label: 'GitLab CI' }, { id: 'cli', label: 'CLI' }],
      tab: 'gh',
      lines: [
        { text: 'jobs:' },
        { text: '  contract-test:' },
        { text: '    steps:' },
        { text: '      - name: Contract test API Pastry 2.0', changed: true },
        { text: '        uses: microcks/test-github-action@v1', changed: true },
        { text: '        with:' },
        { text: "          runner: 'OPEN_API_SCHEMA'", changed: true },
      ],
    },
    template: `<div style="max-width: 360px"><figure mkCodeBlock caption="contract-tests.yml" [tabs]="tabs" [(tab)]="tab" [lines]="lines"></figure></div>`,
  }),
};

export const SchemaMismatch: StoryObj = {
  name: "Narrow gutter, danger frame (schema mismatch)",
  render: () => ({
    props: { lines: [{ text: '{' }, { text: '  "name": "Eclair Cafe",' }, { text: '  "price": "3.9"', bad: true, note: 'schema: number' }, { text: '}' }] },
    template: `<figure mkCodeBlock variant="plain" caption="Response body" lineNumbers gutter="narrow" tone="danger" [lines]="lines"></figure>`,
  }),
};

export const RegionLabel: StoryObj = {
  name: "Same caption, distinct region names",
  render: () => ({
    props: { a: `curl -X POST https://agent.acme.io/a2a -d '{"jsonrpc":"2.0","method":"message/send"}'`, b: 'curl -X POST https://agent.acme.io/v1/message:send' },
    template: `
      <div class="stack">
        <figure mkCodeBlock caption="SendMessage · curl" label="SendMessage · curl, JSON-RPC binding" [code]="a"></figure>
        <figure mkCodeBlock caption="SendMessage · curl" label="SendMessage · curl, HTTP+JSON binding" [code]="b"></figure>
      </div>
    `,
  }),
};

export const SourceRaisedHeader: StoryObj = {
  name: 'Source and raised header',
  render: () => ({
    props: { code: '{\n  "name": "string",\n  "price": "number"\n}' },
    template: `
      <div style="max-width:480px">
        <figure mkCodeBlock caption="Expected" source="Pastry.json" headerTone="raised" [copy]="false" lineNumbers gutter="narrow" [code]="code"></figure>
      </div>
    `,
  }),
};

export const Bare: StoryObj = {
  render: () => ({
    props: { short: '{"name": "Millefeuille"}', long: `curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -d '{"price": 3.9}'` },
    template: `
      <div class="stack" style="max-width:360px">
        <div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-panel);background:var(--bg)">
          <figure mkCodeBlock variant="bare" caption="Sample body" focusable="overflow" [code]="short"></figure>
        </div>
        <div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-panel);background:var(--bg)">
          <figure mkCodeBlock variant="bare" caption="Long sample" focusable="overflow" [code]="long"></figure>
        </div>
      </div>
    `,
  }),
};

/**
 * `<pre mkCodeBlock>`: only the pre. `focusable`: `always` (named region), `overflow` (region only while it scrolls) or
 * `never` (plain pre, only for content that never scrolls: a scrolling pre must stay keyboard reachable, WCAG 2.1.1).
 */
export const PreOnly: StoryObj = {
  name: 'Pre only (<pre mkCodeBlock>)',
  render: () => ({
    props: {
      schema: '{\n  "type": "object",\n  "properties": { "name": { "type": "string" } }\n}',
      long: `curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -d '{"price": 3.9}'`,
      short: '{"dispatcher": "URI_PARTS"}',
    },
    template: `
      <div class="stack" style="max-width:360px">
        <pre mkCodeBlock variant="bare" label="Input schema of getPastry" style="padding:10px 12px;border-radius:4px" [code]="schema"></pre>
        <pre mkCodeBlock variant="plain" focusable="overflow" label="Long command" [code]="long"></pre>
        <pre mkCodeBlock variant="plain" focusable="never" [code]="short"></pre>
      </div>
    `,
  }),
};

/** Figure mode keeps the role, aria-label and tabindex written on the host (the component does not own them there). */
export const ConsumerHostAttributes: StoryObj = {
  name: 'Consumer host attributes kept',
  render: () => ({
    props: { code: '{"name": "Millefeuille"}' },
    template: `<figure mkCodeBlock id="consumer-host" role="group" aria-label="Pastry sample" tabindex="-1" variant="plain" caption="Sample" [code]="code"></figure>`,
  }),
};

const playgroundBase = playground('code-block', 'CodeBlockComponent', {
  code: 'GET /pastries/{name}\nAccept: application/json\n\n200 OK\n{ "name": "Millefeuille", "price": 3.9 }',
  language: 'http',
  caption: 'Request and response',
  label: 'Example exchange',
  source: 'pastry.http',
  copy: true,
  variant: 'framed',
  headerTone: 'raised',
  focusable: 'always',
  lineNumbers: true,
  gutter: 'wide',
});

/** `frame` is a story control only: in Angular the host picks the mode (`<figure mkCodeBlock>` or `<pre mkCodeBlock>`). */
export const Playground: StoryObj = {
  ...playgroundBase,
  args: { ...playgroundBase.args, frame: 'figure' },
  argTypes: { ...playgroundBase.argTypes, frame: { control: 'inline-radio', options: ['figure', 'none'], description: '`none`: `<pre mkCodeBlock>`, only the pre (no figure, header or copy).' } },
  render: (a, ctx) => {
    const { frame, ...rest } = a;
    const out = playgroundBase.render!(rest as typeof a, ctx) as { props: Record<string, unknown>; template: string };
    return frame === 'none' ? { props: rest, template: out.template.replace(/^<figure/, '<pre').replace(/<\/figure>$/, '</pre>') } : { props: rest, template: out.template };
  },
};
