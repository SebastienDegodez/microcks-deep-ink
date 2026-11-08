<script lang="ts">
  import { Chip } from '@microcks/deep-ink';
  let tags = $state(['pastry', 'bakery', 'v2']);
</script>

<div class="inline">{#each tags as t}<Chip onremove={() => (tags = tags.filter((x) => x !== t))}>{t}</Chip>{/each}{#if tags.length === 0}<span class="sb-note">No tags left.</span>{:else}{/if}</div>
