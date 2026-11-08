<script lang="ts">import { TYPE_STYLES } from '@microcks-deep-ink/storybook-shared/fixtures';</script>
<div class="sb-page"><div>
  {#each TYPE_STYLES as s (s.name)}
    <div class="sb-type"><span style:font={`var(--type-${s.name})`} style:letter-spacing={s.name === 'label' ? 'var(--type-label-tracking)' : undefined}>{s.sample}</span><small><code>--type-{s.name}</code> · {s.note}</small></div>
  {/each}
</div></div>
