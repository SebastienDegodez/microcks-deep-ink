# @microcks/deep-ink (Svelte)

**Bounded native Svelte 5 foundation, not the whole library/demo.** Private,
version 0.0.0, not published. `svelte-package` exports `.svelte` components,
JavaScript, declarations and the shared CSS with its existing layers.
The package has only a Svelte peer (`^5.19.0`, supporting class arrays/objects).
There is no React dependency or compatibility-handler API.

```svelte
<script lang="ts">
  import { MethodTag, StatusBadge, LiveIndicator, SummaryStrip, SummaryStripSep } from '@microcks/deep-ink';
  import '@microcks/deep-ink/styles.css';
</script>

<MethodTag method="GET" protocol="REST" class="operation" title="Read" minWidth={52} />
<StatusBadge status="running" label="Retrying">
  {' · attempt '}<strong>2</strong> of 3
</StatusBadge>
<LiveIndicator size="compact" pulse={false} />
<SummaryStrip parts={[{ text: 'Saved', kind: 'label' }, { text: '3 APIs', sep: true }]} lineHeight="inherit" role="note" aria-label="Import summary">
  <SummaryStripSep />
  <a href="/services">View services</a>
</SummaryStrip>
```

Import `styles.no-fonts.css` instead to load fonts yourself. CSS is explicit,
never implicitly injected by components; both CSS files are copied unchanged
from the root registry build. No registry/React source enters the runtime.

## Public family

| Component | Supported variants / props |
| --- | --- |
| `MethodTag` | `method`, `protocol` REST/SOAP/EVENT/gRPC/GRAPHQL/DIRECT/A2A; `size` md/sm/xs; nonzero `minWidth` in px; zero/omitted retains host/default width, matching the React reference |
| `StatusBadge` | `status` conformant/failed/partial/running/never; `size` md/sm/lg; `shape` circled/bare; text `label`; `children` snippet for supplemental rich context |
| `LiveIndicator` | `label`, `paused`, `pausedLabel`; `size` md/sm/compact/lg; `variant` pill/inline/box/dot; `pulse` (default true) |
| `SummaryStrip` | `parts` with `text: string \| Snippet`, `kind` value/label, `sep`; `gap` normal/roomy; `values` secondary/text; `variant` default/canvas; `lineHeight` fixed/inherit; free `children` snippet |
| `SummaryStripSep` | Decorative separator; native span attributes except `aria-hidden`, which is always true |

Props/types, `Protocol`, `Outcome`, `SummaryStripPart` and `PROTOCOL_ATTR` are
exported from the barrel. Components accept native attributes, Svelte class
values and native event handlers (`onclick`, not `onClick`; `class`, not
`className`). Markup content uses Svelte snippets, not ReactNode-compatible
objects. For a rich part, declare `{#snippet value()}<strong>3</strong> APIs{/snippet}`
and pass `parts={[{ text: value }]}`.

Status icons and live dots are decorative. Status always has a visible word:
blank labels fall back, and even an empty supplemental snippet cannot remove
it. LiveIndicator is **not** a status/live region; announce changes elsewhere
and pair a real stream with a Pause control. Include “paused” in `pausedLabel`.
Dot-only labels remain in `.sr-only`; shared reduced-motion CSS disables pulse.
Summary separators are hidden from assistive technology; supply `role="note"`
and an accessible label when the strip represents a page summary.

## Build and verification

From the repository, after shared tokens/registry CSS are built:

```sh
pnpm -C svelte build                # native source + declarations + CSS
pnpm -C svelte check                # library and Storybook, zero warnings
pnpm -C svelte test                 # DOM + separate SSR variant/axe/contracts suites
pnpm -C svelte check:boundaries     # source, declarations, production graph
pnpm -C svelte build:storybook      # isolated Svelte preview, all public variant axes
pnpm -C svelte smoke:package        # actual npm tarball, standalone no-React consumer
```

The pack smoke rebuilds via `prepack`, validates artifact contents, typechecks
typed snippets/native attributes and runs client/SSR builds plus SSR output
assertions. No publish command exists. Axe tests are structural, not contrast
tests. A separate session-only React/Svelte SSR comparison verified zero
differing pixels in 516 comparisons (129 family cases, light/dark, 800/320px,
Chromium 156.0.8078.4, device scale 1). Both fixtures preloaded identical local
OFL fonts, used the same shared CSS and froze motion; exact untrimmed
SummaryStrip part/snippet/link text also matched. This is bounded family
evidence, not a full-demo or CI visual-regression claim.
The standalone fixture is package-validation code, not a partial product demo.
Additional components, full demo and visual comparisons remain separate work.
Loom is outside this family. Native React/Svelte renderers may share neutral
data/event contracts and pure layout rules without sharing a rendering engine;
exact visual/behavior equivalence must be validated before replacing the
existing element.
