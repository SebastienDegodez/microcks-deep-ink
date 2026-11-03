import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { IconComponent } from '@microcks-deep-ink/registry/angular/icon';
import { ICON_NAMES } from '@microcks-deep-ink/registry/angular/icon';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Foundations/Icons',
  decorators: [moduleMetadata({ imports: [IconComponent] })],
  parameters: itemParams(['icon'], "Inline stroke icons, 2px stroke, `currentColor`. Hidden from assistive technology next to text; pass `label` to make one meaningful. No emoji.", { controls: { disable: true } }),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { names: ICON_NAMES },
    template: `
      <ul class="sb-grid" style="list-style:none;margin:0;padding:0">
        @for (n of names; track n) {
          <li class="sb-swatch" style="padding:12px;display:flex;gap:10px;align-items:center"><svg mkIcon [name]="n" [size]="20"></svg><code>{{ n }}</code></li>
        }
      </ul>
    `,
  }),
};

export const Meaningful: StoryObj = {
  name: "With a label",
  render: () => ({
    template: `
      <div class="sb-stack">
        <svg mkIcon name="check" [size]="24" label="Passed"></svg>
        <svg mkIcon name="warning" [size]="24" label="Warning"></svg>
        <span class="sb-note">Icons with a label get <code>role="img"</code> and <code>aria-label</code>.</span>
      </div>
    `,
  }),
};
