<script lang="ts">
  import { CommandBar } from '@microcks/deep-ink';
  import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
  let last = $state('none');
</script>

<div style="max-width:560px"><CommandBar inline items={COMMANDS} placeholder="Search services, operations and commands" oncommand={(item) => (last = item.label)} /><p role="status" class="sb-note">Last command: {last}</p></div>
