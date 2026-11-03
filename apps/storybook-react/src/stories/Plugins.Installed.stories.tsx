import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect, useState } from 'react';
import { getPluginHost } from '@microcks-deep-ink/registry/react/plugin-slot';
import { ApiBadge } from '@microcks-deep-ink/registry/react/api-badge';
import { CodeBlock } from '@microcks-deep-ink/registry/react/code-block';
import { Panel } from '@microcks-deep-ink/registry/react/panel';
import type { MicrocksPluginManifest } from '@microcks-deep-ink/plugin-sdk';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import { SAMPLE_MANIFEST } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Plugins/Installed plugins',
  parameters: itemParams(['plugin-slot', 'panel', 'api-badge', 'code-block'], 'The plugin host lives on `globalThis`, so the shell and every plugin bundle share one registry. This view lists what is registered, with the manifest of the demo plugin.'),
  loaders: [async () => ({ ready: await registerDemoPlugin() })],
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const read = () => getPluginHost().list() as unknown as MicrocksPluginManifest[];
    const [list, setList] = useState(read);
    useEffect(() => getPluginHost().subscribe(() => setList(read())), []);
    return (
      <div className="sb-col" style={{ maxWidth: 640 }}>
        {list.map((m) => (
          <Panel key={m.id} title={m.name}>
            <div className="sb-col">
              <span className="sb-note">{m.id} · {m.version} · Microcks {m.microcks}</span>
              <span>{m.description}</span>
              <div className="di-inline">
                {m.protocols?.map((p) => <ApiBadge key={p} protocol={p} name={m.name} version={m.version} />)}
                {m.backend ? <ApiBadge label="backend" value={m.backend.extensions.map((e) => e.point).join(', ')} /> : null}
                {m.frontend ? <ApiBadge label="frontend" value={m.frontend.contributes.join(', ')} /> : null}
              </div>
            </div>
          </Panel>
        ))}
        <CodeBlock caption="Manifest" language="json" code={JSON.stringify(SAMPLE_MANIFEST, null, 2)} />
      </div>
    );
  },
};
