import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MkIcon } from '@microcks-deep-ink/react';
import { COLOR_GROUPS, RADII, SPACING, TYPE_STYLES } from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta = { title: 'Foundations', parameters: { controls: { disable: true } } };
export default meta;

const ICONS = ['cockpit', 'apis', 'upload', 'tests', 'sources', 'usage', 'traces', 'hub', 'admin', 'plugin', 'check', 'cross', 'warning', 'running', 'circle', 'spark', 'search', 'copy', 'sun', 'moon', 'chevron', 'user'];

export const Colors: StoryObj = {
  render: () => (
    <div className="di-page">
      <h2>Colors</h2>
      <p className="di-note">Every token has a value in both themes. Switch the theme in the toolbar: names stay, values change.</p>
      {COLOR_GROUPS.map((g) => (
        <section key={g.title}>
          <h3>{g.title}</h3>
          <div className="di-grid">
            {g.tokens.map((t) => (
              <div className="di-swatch" key={t}>
                <i style={{ background: `var(--${t})` }} />
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

export const Typography: StoryObj = {
  render: () => (
    <div className="di-page">
      <h2>Typography</h2>
      <div>
        {TYPE_STYLES.map((s) => (
          <div className="di-type" key={s.name}>
            <span style={{ font: `var(--type-${s.name})`, letterSpacing: s.name === 'label' ? 'var(--type-label-tracking)' : undefined }}>{s.sample}</span>
            <small>
              <code>--type-{s.name}</code> · {s.note}
            </small>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const SpacingAndRadius: StoryObj = {
  name: 'Spacing & radius',
  render: () => (
    <div className="di-page">
      <h2>Spacing & radius</h2>
      <section>
        <h3>Spacing</h3>
        {SPACING.map((s) => (
          <div className="di-row" key={s}>
            <code>--{s}</code>
            <span className="di-bar" style={{ width: `var(--${s})` }} />
          </div>
        ))}
      </section>
      <section>
        <h3>Radius: the shape has a meaning</h3>
        <div className="di-stack">
          {RADII.map((r) => (
            <div className="di-col" key={r} style={{ alignItems: 'center' }}>
              <span className="di-box" style={{ borderRadius: `var(--${r})` }} />
              <code style={{ font: 'var(--type-code)', fontSize: 12 }}>--{r}</code>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3>Shadows: overlays and focus only</h3>
        <div className="di-stack">
          <span className="di-box" style={{ boxShadow: 'var(--shadow-focus)', borderRadius: 'var(--radius-control)' }} />
          <span className="di-box" style={{ boxShadow: 'var(--shadow-overlay)', borderRadius: 'var(--radius-node)', border: '1px solid var(--border-strong)' }} />
        </div>
      </section>
    </div>
  ),
};

export const Icons: StoryObj = {
  render: () => (
    <div className="di-page">
      <h2>Icons</h2>
      <p className="di-note">Inline stroke icons, 2px stroke, currentColor, hidden from assistive tech next to text. No emoji.</p>
      <div className="di-grid">
        {ICONS.map((n) => (
          <div className="di-swatch" key={n} style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <MkIcon name={n} size={20} />
            <code>{n}</code>
          </div>
        ))}
      </div>
    </div>
  ),
};
