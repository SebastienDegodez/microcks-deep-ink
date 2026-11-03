import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Foundations/Focus and motion',
  decorators: [moduleMetadata({ imports: [ButtonDirective] })],
  parameters: itemParams(['base'], "One focus ring for the whole system (`:focus-visible`, action outline plus the focus shadow). Transitions and animations are neutralised under `prefers-reduced-motion: reduce`. Helpers: `.sr-only`, `.skip-link`, `.stack`, `.inline`.", { controls: { disable: true } }),
};
export default meta;

export const Default: StoryObj = {
  name: "Focus ring",
  render: () => ({
    template: `
      <div class="sb-page">
        <p class="sb-note">Press Tab to move focus: the ring is the same on every control.</p>
        <div class="inline">
          <button mkButton>Secondary</button>
          <button mkButton variant="primary">Primary</button>
          <a class="link" href="#focus">A link</a>
          <input class="input" aria-label="A text input" value="Text input" />
        </div>
      </div>
    `,
  }),
};

export const Helpers: StoryObj = {
  render: () => ({
    template: `
      <div class="sb-page">
        <div class="stack">
          <p class="sb-note"><code>.stack</code> lays children in a column, <code>.inline</code> in a wrapping row. Gap comes from <code>--gap</code>.</p>
          <div class="inline">
            <span class="sb-box" aria-hidden="true"></span>
            <span class="sb-box" aria-hidden="true"></span>
            <span class="sb-box" aria-hidden="true"></span>
          </div>
          <p>A screen reader reads: <span class="sr-only">(hidden helper text) </span>the text next to it. Look: nothing is shown for the helper.</p>
        </div>
      </div>
    `,
  }),
};
