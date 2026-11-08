<script lang="ts">
  import { CommandBar, Kbd } from '@microcks/deep-ink';
  import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
  import Frame from './Frame.svelte';
  let last = $state('');
</script>
<Frame label="Command bar">
  <p class="sb-note">In the app, <Kbd>⌘</Kbd> <Kbd>K</Kbd> (<Kbd>Ctrl</Kbd> <Kbd>K</Kbd>) opens it as a dialog. Here it is inline: type, use the arrow keys, press <Kbd>Enter</Kbd>.</p>
  <div style:max-width="560px"><CommandBar inline globalShortcut={false} items={COMMANDS} label="Command bar" placeholder="Type a command or a service" oncommand={(item) => { last = item.label; }} /></div>
  <p class="sb-note" role="status">{last ? `Ran: ${last}` : 'No command run yet.'}</p>
</Frame>
