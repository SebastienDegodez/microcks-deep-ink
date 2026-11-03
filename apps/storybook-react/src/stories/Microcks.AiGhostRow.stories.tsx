import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { AiGhostRow } from '@microcks-deep-ink/registry/react/ai-ghost-row';
import { MethodTag } from '@microcks-deep-ink/registry/react/method-tag';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/AiGhostRow',
  parameters: itemParams(['ai-ghost-row', 'button', 'icon', 'method-tag'], 'A suggestion that is not saved until accepted. The group is named "AI suggestion: <name>" and each button repeats the name for screen readers ("Accept getPastry example").'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const [msg, setMsg] = useState('');
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <AiGhostRow name="getPastry example" onAccept={() => setMsg('Accepted')} onEdit={() => setMsg('Editing')} onReject={() => setMsg('Rejected')}>
          <MethodTag method="GET" /> <code>/pastries/Eclair</code> → 200 <code>{'{ "name": "Eclair" }'}</code>
        </AiGhostRow>
        <p role="status" className="sb-note">{msg}</p>
      </div>
    );
  },
};

export const Busy: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <AiGhostRow name="postPastry example" busy onAccept={() => undefined} onEdit={() => undefined} onReject={() => undefined}>
        <MethodTag method="POST" /> <code>/pastries</code> → 201
      </AiGhostRow>
    </div>
  ),
};
