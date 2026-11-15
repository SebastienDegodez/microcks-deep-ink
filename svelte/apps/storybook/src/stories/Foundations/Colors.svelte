<script lang="ts">import { COLOR_GROUPS } from '@microcks-deep-ink/storybook-shared/fixtures';</script>
<div class="sb-page">
  {#each COLOR_GROUPS as g (g.title)}
    <section aria-labelledby={`colors-${g.title}`}>
      <h3 id={`colors-${g.title}`}>{g.title}</h3>
      <div class="sb-grid">
        {#each g.tokens as t (t)}
          <div class="sb-swatch"><i style:background={`var(--${t})`} aria-hidden="true"></i><div><code>--{t}</code></div></div>
        {/each}
      </div>
    </section>
  {/each}
</div>
