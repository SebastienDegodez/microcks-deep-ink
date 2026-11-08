<script lang="ts">
import { TaskTimeline } from '@microcks/deep-ink';
import { AGENT_LIFECYCLE } from '@microcks-deep-ink/storybook-shared/fixtures';

let selected = $state<number | undefined>(2);
</script>
<TaskTimeline nodes={AGENT_LIFECYCLE} selectedIndex={selected} onselectnode={(value) => selected = value} />
