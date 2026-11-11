<script lang="ts">
  import { NotFoundError } from '@microcks/demo-core/application/shared';
  import PageHeader from './PageHeader.svelte';
  import { usePageTitle } from './page-title.svelte.js';

  /** Error page of the page area (inside the shell): a page that throws, or fails to load, ends up here. */
  let { error }: { error: unknown } = $props();

  usePageTitle('Something went wrong · Microcks');

  const message = $derived(
    error instanceof NotFoundError ? error.message : error instanceof Error ? error.message : 'Unknown error',
  );
</script>

<PageHeader title="Something went wrong" /><div role="alert" class="callout" data-tone="danger"><p>{message}</p></div>
