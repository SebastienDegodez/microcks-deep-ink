<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import { EmptyState } from '@microcks/deep-ink';
</script>

<EmptyState title="No runs yet" align="start" headingLevel={3}>{#snippet actions()}<Button variant="primary" icon="tests">Run a test</Button>{/snippet}Runs appear here after the first test.</EmptyState>
