import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { DropZone } from '@microcks-deep-ink/registry/react/drop-zone';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/DropZone',
  parameters: itemParams(['drop-zone', 'button', 'icon'], 'Drag and drop is an enhancement. The zone holds a real `<input type="file">` and a visible "Choose files" button, so keyboard and screen reader users upload the same way. A live region announces "2 files ready".'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const [names, setNames] = useState<string[]>([]);
    return (
      <div className="stack" style={{ maxWidth: 560 }}>
        <DropZone heading="Import a contract" hint="OpenAPI, AsyncAPI, gRPC, GraphQL or Postman" accept=".yaml,.yml,.json,.proto,.graphql" onFiles={(f) => setNames(f.map((x) => x.name))} />
        {names.length ? <p className="sb-note">Selected: {names.join(', ')}</p> : null}
      </div>
    );
  },
};

export const Single: StoryObj = {
  name: 'Single file',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <DropZone heading="Replace the contract" hint="One YAML or JSON file" multiple={false} accept=".yaml,.yml,.json" onFiles={() => undefined} />
    </div>
  ),
};
