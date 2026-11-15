<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import { CommandBar } from '@microcks/deep-ink';
  import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
  let open = $state(false);
</script>

<div class="sb-col"><Button variant="primary" icon="search" onclick={() => (open = true)}>Open the command bar</Button><p class="sb-note">Or press Ctrl+K (⌘K on macOS) anywhere on the page.</p><CommandBar items={COMMANDS} open={open} onclose={() => (open = false)} oncommand={() => (open = false)} /></div>
