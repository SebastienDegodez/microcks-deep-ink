<script lang="ts">
  import { Button, Callout, EmptyState } from '@microcks/deep-ink';
  import { NotFoundError } from '@microcks/demo-core/application/shared';

  /**
   * Error state. With `what`: "{what} could not be loaded" and a Retry button, and an unknown entity
   * (`NotFoundError`) gets its own wording. With `title` (or neither): that title and a "Try again" button.
   */
  interface Props {
    error: Error;
    what?: string;
    title?: string;
    onretry?: () => void;
  }

  let { error, what, title = 'Something went wrong', onretry }: Props = $props();
</script>

{#snippet tryAgain()}<Button size="sm" icon="retry" onclick={onretry}>Try again</Button>{/snippet}
{#snippet retry()}<Button onclick={onretry}>Retry</Button>{/snippet}

{#if what === undefined}<Callout tone="danger" {title} live="assertive" actions={onretry ? tryAgain : undefined}>{error.message}</Callout
  >{:else if error instanceof NotFoundError}<EmptyState title="{what} not found" headingLevel={2}><p>{error.message}<!---->.</p></EmptyState
  >{:else}<Callout tone="danger" title="{what} could not be loaded" live="assertive" actions={onretry ? retry : undefined}
    ><p>{error.message}</p></Callout
  >{/if}
