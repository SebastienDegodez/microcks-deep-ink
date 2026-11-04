import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { CodeBlock } from '@microcks-deep-ink/registry/react/code-block';
import { RUN14_FAILURE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Components/CodeBlock',
  parameters: itemParams(['code-block', 'copy-button'], 'A `<figure>` with a focusable `<pre>` so keyboard users can scroll it. A bad line has a "✕" marker and a visible note, not color alone.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <CodeBlock caption="Mock response" language="json" code={'{\n  "name": "Millefeuille",\n  "price": 3.9\n}'} />
    </div>
  ),
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
