<script lang="ts">
  import { Button, CopyButton, Link } from '@microcks/deep-ink';
  import { MOCK_BASE } from '@microcks-deep-ink/storybook-shared/fixtures';
  import Frame from './Frame.svelte';
</script>
<Frame label="Actions">
  <p class="sb-note">One primary per task region. Every action is a native button or link.</p>
  <div class="inline"><Button variant="primary" icon="play">Run test</Button><Button>Cancel</Button><Button variant="ghost">Skip</Button><Button variant="dashed" icon="plus">Add header</Button><Button variant="danger">Delete service</Button><CopyButton value={`${MOCK_BASE}/pastries`} label="Copy mock URL" /><Link href="#05-actions">Back to 05 Actions</Link></div>
</Frame>
