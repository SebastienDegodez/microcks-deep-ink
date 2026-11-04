import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { CiPanel } from '@microcks-deep-ink/registry/react/ci-panel';
import { ProjectionPill } from '@microcks-deep-ink/registry/react/projection-pill';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/CiPanel',
  parameters: itemParams(['ci-panel', 'copy-button', 'button'], '"Run it from CI": a region named by its title, shown by a toggle button with `aria-expanded` and `aria-controls`. Copy announces its result; the command wraps.'),
} satisfies Meta;

const CMD = "microcks test 'Pastry Concierge:1.0' https://concierge.acme.io/a2a A2A_CONFORMANCE \\\n  --microcksURL=https://microcks.acme.io/api/ --waitFor=30sec";

export const Default: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <div className="inline">
          <Button className="ci-panel-toggle" icon="code" aria-expanded={open} aria-controls="sb-ci" onClick={() => setOpen(!open)}>
            Run it from CI
          </Button>
        </div>
        {open ? (
          <CiPanel
            id="sb-ci"
            dashed
            title="Run this test in your pipeline"
            pill={<ProjectionPill>Projection · proposed CLI</ProjectionPill>}
            hint="Proposed, not available today: the existing microcks test command with the new runner name. It exits non-zero when a check fails."
            command={CMD}
            footnote="Add --keycloakClientId and --keycloakClientSecret when your Microcks instance has authentication on."
          />
        ) : null}
      </div>
    );
  },
};
