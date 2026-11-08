import DefaultComposition from './Components.CodeBlock/Default.svelte';
import ExcerptWithTabsComposition from './Components.CodeBlock/ExcerptWithTabs.svelte';
import WithBadLineComposition from './Components.CodeBlock/WithBadLine.svelte';
import ScrollingComposition from './Components.CodeBlock/Scrolling.svelte';
import FormatTabsComposition from './Components.CodeBlock/FormatTabs.svelte';
import PlainComposition from './Components.CodeBlock/Plain.svelte';
import NumberedComposition from './Components.CodeBlock/Numbered.svelte';
import ChangedLinesComposition from './Components.CodeBlock/ChangedLines.svelte';
import SchemaMismatchComposition from './Components.CodeBlock/SchemaMismatch.svelte';
import RegionLabelComposition from './Components.CodeBlock/RegionLabel.svelte';
import SourceRaisedHeaderComposition from './Components.CodeBlock/SourceRaisedHeader.svelte';
import BareComposition from './Components.CodeBlock/Bare.svelte';
import PreOnlyComposition from './Components.CodeBlock/PreOnly.svelte';
import PlaygroundComposition from './Components.CodeBlock/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { CodeBlock } from '@microcks/deep-ink';
import { RUN14_FAILURE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';


export default {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  parameters: itemParams(['code-block', 'copy-button'], 'A `<figure>` with a focusable `<pre>` so keyboard users can scroll it. A bad line has a "✕" marker and a visible note, not color alone.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `startLine` for an excerpt, and `tabsLabel` to name the tab list. */
export const ExcerptWithTabs: StoryObj<typeof ExcerptWithTabsComposition> = {
  name: 'Excerpt and named tabs',
  render: () => ({ Component: ExcerptWithTabsComposition, props: {} })
};

export const WithBadLine: StoryObj<typeof WithBadLineComposition> = {
  name: 'Failing line',
  render: () => ({ Component: WithBadLineComposition, props: {} })
};

export const Scrolling: StoryObj<typeof ScrollingComposition> = {
  render: () => ({ Component: ScrollingComposition, props: {} })
};

export const FormatTabs: StoryObj<typeof FormatTabsComposition> = {
  name: 'Format tabs',
  render: () => ({ Component: FormatTabsComposition, props: {} })
};

export const Plain: StoryObj<typeof PlainComposition> = {
  render: () => ({ Component: PlainComposition, props: {} })
};

export const Numbered: StoryObj<typeof NumberedComposition> = {
  name: 'Line numbers and inline note',
  render: () => ({ Component: NumberedComposition, props: {} })
};

export const ChangedLines: StoryObj<typeof ChangedLinesComposition> = {
  name: 'Changed lines (diff)',
  render: () => ({ Component: ChangedLinesComposition, props: {} })
};

export const SchemaMismatch: StoryObj<typeof SchemaMismatchComposition> = {
  name: 'Narrow gutter, danger frame (schema mismatch)',
  render: () => ({ Component: SchemaMismatchComposition, props: {} })
};

export const RegionLabel: StoryObj<typeof RegionLabelComposition> = {
  name: 'Same caption, distinct region names',
  render: () => ({ Component: RegionLabelComposition, props: {} })
};

/** `source` at the end of the header, the caption as an uppercase title, on the raised fill (`headerTone="raised"`). */
export const SourceRaisedHeader: StoryObj<typeof SourceRaisedHeaderComposition> = {
  name: 'Source and raised header',
  render: () => ({ Component: SourceRaisedHeaderComposition, props: {} })
};

/** `bare`: no frame, no header, no padding, for a `<pre>` inside a card. `focusable="overflow"`: a region only when it scrolls. */
export const Bare: StoryObj<typeof BareComposition> = {
  render: () => ({ Component: BareComposition, props: {} })
};

/**
 * `frame="none"`: only the `<pre class="code-pre">`, no figure, header or copy. With `variant="bare"` it has no border,
 * radius or padding, so the page keeps its own padding class. `focusable`: `always` (named region), `overflow`
 * (region only while it scrolls) or `never` (plain `<pre>`, only for content that never scrolls: a scrolling pre must stay
 * keyboard reachable, WCAG 2.1.1; use `overflow` when it may scroll).
 */
export const PreOnly: StoryObj<typeof PreOnlyComposition> = {
  name: 'Pre only (frame="none")',
  render: () => ({ Component: PreOnlyComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { code: 'GET /pastries/{name}\nAccept: application/json\n\n200 OK\n{ "name": "Millefeuille", "price": 3.9 }', language: 'http', caption: 'Request and response', label: 'Example exchange', copy: true, variant: 'framed', lineNumbers: true, startLine: 1, gutter: 'wide', tone: undefined, maxHeight: 240, source: 'pastry.http', headerTone: undefined, focusable: 'always', frame: 'figure' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['framed', 'plain', 'bare'] },
    headerTone: { control: 'inline-radio', options: [undefined, 'raised'] },
    focusable: { control: 'inline-radio', options: ['always', 'overflow', 'never'] },
    frame: { control: 'inline-radio', options: ['figure', 'none'] },
    gutter: { control: 'inline-radio', options: ['wide', 'narrow'] },
    tone: { control: 'inline-radio', options: [undefined, 'danger'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
