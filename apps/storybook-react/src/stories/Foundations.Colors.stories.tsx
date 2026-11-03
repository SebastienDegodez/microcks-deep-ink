import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { COLOR_GROUPS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Foundations/Colors',
  parameters: itemParams(['tokens'], 'Every token has a value in both themes. Switch the theme in the toolbar: names stay, values change. Text roles are at least 4.5:1 and control borders at least 3:1 on every ground (enforced by the tokens contrast test).', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="sb-page">
      {COLOR_GROUPS.map((g) => (
        <section key={g.title} aria-labelledby={`colors-${g.title}`}>
          <h3 id={`colors-${g.title}`}>{g.title}</h3>
          <div className="sb-grid">
            {g.tokens.map((t) => (
              <div className="sb-swatch" key={t}>
                <i style={{ background: `var(--${t})` }} aria-hidden="true" />
                <div>
                  <code>--{t}</code>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
