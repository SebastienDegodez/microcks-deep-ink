<script lang="ts">
  import { CommandBar } from '@microcks/deep-ink';
  import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
</script>

<CommandBar inline globalShortcut={false} items={COMMANDS} label="Local commands" placeholder="Type a command" />
