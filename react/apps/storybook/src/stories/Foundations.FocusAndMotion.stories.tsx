import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Foundations/Focus and motion',
  parameters: itemParams(['base'], 'One focus ring for the whole system (`:focus-visible`, action outline plus the focus shadow). Transitions and animations are neutralised under `prefers-reduced-motion: reduce`. Helpers: `.sr-only`, `.skip-link`, `.stack`, `.inline`.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  name: 'Focus ring',
  render: () => (
    <div className="sb-page">
      <p className="sb-note">Press Tab to move focus: the ring is the same on every control.</p>
      <div className="inline">
        <Button>Secondary</Button>
        <Button variant="primary">Primary</Button>
        <a className="link" href="#focus">A link</a>
        <input className="input" aria-label="A text input" defaultValue="Text input" />
      </div>
    </div>
  ),
};

export const Helpers: StoryObj = {
  render: () => (
    <div className="sb-page">
      <div className="stack">
        <p className="sb-note">
          <code>.stack</code> lays children in a column, <code>.inline</code> in a wrapping row. Gap comes from <code>--gap</code>.
        </p>
        <div className="inline">
          <span className="sb-box" aria-hidden="true" />
          <span className="sb-box" aria-hidden="true" />
          <span className="sb-box" aria-hidden="true" />
        </div>
        <p>
          A screen reader reads: <span className="sr-only">(hidden helper text) </span>the text next to it. Look: nothing is shown for the helper.
        </p>
      </div>
    </div>
  ),
};
