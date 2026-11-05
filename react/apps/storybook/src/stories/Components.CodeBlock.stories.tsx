import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { CodeBlock } from '@microcks/deep-ink';
import { RUN14_FAILURE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  parameters: itemParams(['code-block', 'copy-button'], 'A `<figure>` with a focusable `<pre>` so keyboard users can scroll it. A bad line has a "✕" marker and a visible note, not color alone.'),
} satisfies Meta<typeof CodeBlock>;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <CodeBlock caption="Mock response" language="json" code={'{\n  "name": "Millefeuille",\n  "price": 3.9\n}'} />
    </div>
  ),
};

/** `startLine` for an excerpt, and `tabsLabel` to name the tab list. */
export const ExcerptWithTabs: StoryObj = {
  name: 'Excerpt and named tabs',
  render: () => {
    const [tab, setTab] = useState('request');
    return (
      <div style={{ maxWidth: 560 }}>
        <CodeBlock
          language="json"
          lineNumbers
          startLine={41}
          tabs={[{ id: 'request', label: 'Request' }, { id: 'response', label: 'Response' }]}
          tab={tab}
          onTabChange={setTab}
          tabsLabel="Exchange parts"
          code={tab === 'request' ? '{\n  "name": "Millefeuille"\n}' : '{\n  "name": "Millefeuille",\n  "price": 3.9\n}'}
        />
      </div>
    );
  },
};

export const WithBadLine: StoryObj = {
  name: 'Failing line',
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <CodeBlock caption={`${RUN14_FAILURE.request} · response`} language="json" lines={RUN14_FAILURE.response} />
    </div>
  ),
};

export const Scrolling: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <CodeBlock caption="Long line" copy={false} maxHeight={120} code={'curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -H "Content-Type: application/json" -d \'{"price": 3.9}\''} />
    </div>
  ),
};

export const FormatTabs: StoryObj = {
  name: 'Format tabs',
  render: function Render() {
    const SNIPPETS: Record<string, string> = {
      curl: "curl -X GET 'http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille'",
      httpie: 'http GET http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille',
    };
    const [tab, setTab] = useState('curl');
    return (
      <CodeBlock
        code={SNIPPETS[tab]}
        language="shell"
        tabs={[{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }]}
        tab={tab}
        onTabChange={setTab}
      />
    );
  },
};

export const Plain: StoryObj = {
  render: () => <CodeBlock variant="plain" caption="Stored as" code={'{"dispatcher": "URI_PARTS", "dispatcherRules": "name"}'} />,
};

export const Numbered: StoryObj = {
  name: 'Line numbers and inline note',
  render: () => (
    <CodeBlock
      variant="plain"
      caption="Response body"
      lineNumbers
      lines={[{ text: '{' }, { text: '  "name": "Eclair Cafe",' }, { text: '  "price": "2.5"', bad: true, note: 'schema: number' }, { text: '}' }]}
    />
  ),
};

export const ChangedLines: StoryObj = {
  name: 'Changed lines (diff)',
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <CodeBlock
        caption="contract-tests.yml"
        tabs={[{ id: 'gh', label: 'GitHub Actions' }, { id: 'gl', label: 'GitLab CI' }, { id: 'cli', label: 'CLI' }]}
        tab="gh"
        onTabChange={() => {}}
        lines={[
          { text: 'jobs:' },
          { text: '  contract-test:' },
          { text: '    steps:' },
          { text: '      - name: Contract test API Pastry 2.0', changed: true },
          { text: '        uses: microcks/test-github-action@v1', changed: true },
          { text: '        with:' },
          { text: "          runner: 'OPEN_API_SCHEMA'", changed: true },
        ]}
      />
    </div>
  ),
};

export const SchemaMismatch: StoryObj = {
  name: 'Narrow gutter, danger frame (schema mismatch)',
  render: () => (
    <CodeBlock
      variant="plain"
      caption="Response body"
      lineNumbers
      gutter="narrow"
      tone="danger"
      lines={[{ text: '{' }, { text: '  "name": "Eclair Cafe",' }, { text: '  "price": "3.9"', bad: true, note: 'schema: number' }, { text: '}' }]}
    />
  ),
};

export const RegionLabel: StoryObj = {
  name: 'Same caption, distinct region names',
  render: () => (
    <div className="stack">
      <CodeBlock caption="SendMessage · curl" label="SendMessage · curl, JSON-RPC binding" code={"curl -X POST https://agent.acme.io/a2a -d '{\"jsonrpc\":\"2.0\",\"method\":\"message/send\"}'"} />
      <CodeBlock caption="SendMessage · curl" label="SendMessage · curl, HTTP+JSON binding" code="curl -X POST https://agent.acme.io/v1/message:send" />
    </div>
  ),
};

/** `source` at the end of the header, the caption as an uppercase title, on the raised fill (`headerTone="raised"`). */
export const SourceRaisedHeader: StoryObj = {
  name: 'Source and raised header',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <CodeBlock caption="Expected" source="Pastry.json" headerTone="raised" copy={false} lineNumbers gutter="narrow" code={'{\n  "name": "string",\n  "price": "number"\n}'} />
    </div>
  ),
};

/** `bare`: no frame, no header, no padding, for a `<pre>` inside a card. `focusable="overflow"`: a region only when it scrolls. */
export const Bare: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 360 }}>
      <div style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-panel)', background: 'var(--bg)' }}>
        <CodeBlock variant="bare" caption="Sample body" focusable="overflow" code={'{"name": "Millefeuille"}'} />
      </div>
      <div style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-panel)', background: 'var(--bg)' }}>
        <CodeBlock variant="bare" caption="Long sample" focusable="overflow" code={'curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -d \'{"price": 3.9}\''} />
      </div>
    </div>
  ),
};

/**
 * `frame="none"`: only the `<pre class="code-pre">`, no figure, header or copy. With `variant="bare"` it has no border,
 * radius or padding, so the page keeps its own padding class. `focusable`: `always` (named region), `overflow`
 * (region only while it scrolls) or `never` (plain `<pre>`, only for content that never scrolls: a scrolling pre must stay
 * keyboard reachable, WCAG 2.1.1; use `overflow` when it may scroll).
 */
export const PreOnly: StoryObj = {
  name: 'Pre only (frame="none")',
  render: () => (
    <div className="stack" style={{ maxWidth: 360 }}>
      <CodeBlock frame="none" variant="bare" label="Input schema of getPastry" style={{ padding: '10px 12px', borderRadius: 4 }} code={'{\n  "type": "object",\n  "properties": { "name": { "type": "string" } }\n}'} />
      <CodeBlock frame="none" variant="plain" focusable="overflow" label="Long command" code={'curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -d \'{"price": 3.9}\''} />
      <CodeBlock frame="none" variant="plain" focusable="never" code={'{"dispatcher": "URI_PARTS"}'} />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof CodeBlock> = {
  args: {
    code: 'GET /pastries/{name}\nAccept: application/json\n\n200 OK\n{ "name": "Millefeuille", "price": 3.9 }',
    language: 'http',
    caption: 'Request and response',
    label: 'Example exchange',
    copy: true,
    variant: 'framed',
    lineNumbers: true,
    startLine: 1,
    gutter: 'wide',
    tone: undefined,
    maxHeight: 240,
    source: 'pastry.http',
    headerTone: undefined,
    focusable: 'always',
    frame: 'figure',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['framed', 'plain', 'bare'] },
    headerTone: { control: 'inline-radio', options: [undefined, 'raised'] },
    focusable: { control: 'inline-radio', options: ['always', 'overflow', 'never'] },
    frame: { control: 'inline-radio', options: ['figure', 'none'] },
    gutter: { control: 'inline-radio', options: ['wide', 'narrow'] },
    tone: { control: 'inline-radio', options: [undefined, 'danger'] },
  },
};
