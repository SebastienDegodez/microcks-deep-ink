<script lang="ts">
  import { CommandBar } from '@microcks/deep-ink';
  import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
  let last = $state('');
</script>

<div class="sb-col" style="max-width:560px"><CommandBar inline items={COMMANDS} label="Command bar" placeholder="Type a command or a service" oncommand={(item) => (last = item.label)} /><p class="sb-note" role="status">{last ? `Ran: ${last}` : 'Press Enter on an option to run it.'}</p></div>
