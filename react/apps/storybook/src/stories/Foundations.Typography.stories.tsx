import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { TYPE_STYLES } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Foundations/Typography',
  parameters: itemParams(['tokens'], 'Type roles are CSS shorthands (`font: var(--type-body)`). Sizes are in px for the specimen; use rem in product code so the text follows the user setting.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="sb-page">
      <div>
        {TYPE_STYLES.map((s) => (
          <div className="sb-type" key={s.name}>
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
