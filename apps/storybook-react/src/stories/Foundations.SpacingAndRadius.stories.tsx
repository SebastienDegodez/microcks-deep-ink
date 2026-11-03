import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { RADII, SPACING } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Foundations/Spacing and radius',
  parameters: itemParams(['tokens'], 'Space follows a 4px rhythm. The shape of a corner has a meaning: controls are near-square, badges are tight, panels and nodes are rounder, only pills are round.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="sb-page">
      <section aria-labelledby="sp-spacing">
        <h3 id="sp-spacing">Spacing</h3>
        {SPACING.map((s) => (
          <div className="sb-row" key={s}>
            <code>--{s}</code>
            <span className="sb-bar" style={{ width: `var(--${s})` }} aria-hidden="true" />
          </div>
        ))}
      </section>
      <section aria-labelledby="sp-radius">
        <h3 id="sp-radius">Radius</h3>
        <div className="sb-stack">
          {RADII.map((r) => (
            <div className="sb-col" key={r} style={{ alignItems: 'center' }}>
              <span className="sb-box" style={{ borderRadius: `var(--${r})` }} aria-hidden="true" />
              <code style={{ font: 'var(--type-code)', fontSize: 12 }}>--{r}</code>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="sp-shadow">
        <h3 id="sp-shadow">Shadows: overlays and focus only</h3>
        <div className="sb-stack">
          <span className="sb-box" aria-hidden="true" style={{ boxShadow: 'var(--shadow-focus)', borderRadius: 'var(--radius-control)' }} />
          <span className="sb-box" aria-hidden="true" style={{ boxShadow: 'var(--shadow-overlay)', borderRadius: 'var(--radius-node)', border: '1px solid var(--border-strong)' }} />
        </div>
      </section>
    </div>
  ),
};
