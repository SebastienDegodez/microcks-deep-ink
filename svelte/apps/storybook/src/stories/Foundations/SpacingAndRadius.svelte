<script lang="ts">import { RADII, SPACING } from '@microcks-deep-ink/storybook-shared/fixtures';</script>
<div class="sb-page">
  <section aria-labelledby="sp-spacing"><h3 id="sp-spacing">Spacing</h3>
    {#each SPACING as s (s)}<div class="sb-row"><code>--{s}</code><span class="sb-bar" style:width={`var(--${s})`} aria-hidden="true"></span></div>{/each}
  </section>
  <section aria-labelledby="sp-radius"><h3 id="sp-radius">Radius</h3><div class="sb-stack">
    {#each RADII as r (r)}<div class="sb-col" style:align-items="center"><span class="sb-box" style:border-radius={`var(--${r})`} aria-hidden="true"></span><code style:font="var(--type-code)" style:font-size="12px">--{r}</code></div>{/each}
  </div></section>
  <section aria-labelledby="sp-shadow"><h3 id="sp-shadow">Shadows: overlays and focus only</h3><div class="sb-stack">
    <span class="sb-box" aria-hidden="true" style:box-shadow="var(--shadow-focus)" style:border-radius="var(--radius-control)"></span>
    <span class="sb-box" aria-hidden="true" style:box-shadow="var(--shadow-overlay)" style:border-radius="var(--radius-node)" style:border="1px solid var(--border-strong)"></span>
  </div></section>
</div>
