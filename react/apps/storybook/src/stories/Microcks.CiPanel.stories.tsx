import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Button } from '@microcks/deep-ink';
import { CiPanel } from '@microcks/deep-ink';
import { ProjectionPill } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/CiPanel',
  component: CiPanel,
  parameters: itemParams(['ci-panel', 'copy-button', 'button'], '"Run it from CI": a region named by its title, shown by a toggle button with `aria-expanded` and `aria-controls`. Copy announces its result; the command wraps.'),
} satisfies Meta<typeof CiPanel>;

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
            copyLabel="Copy command"
            footnote="Add --keycloakClientId and --keycloakClientSecret when your Microcks instance has authentication on."
          />
        ) : null}
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof CiPanel> = {
  args: { title: 'Run it from your pipeline', pill: <ProjectionPill />, hint: 'Add this command to a CI job.', command: 'microcks test API-Pastry:2.0 http://pastry:8080 OPEN_API_SCHEMA', footnote: 'Needs the Microcks CLI.', dashed: false, copyLabel: 'Copy' },
};
