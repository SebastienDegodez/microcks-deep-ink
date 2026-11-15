<script lang="ts">
import { TASK_STATES, TaskStateTag } from '@microcks/deep-ink';


</script>
<div class="inline">{#each TASK_STATES as s (s)}<TaskStateTag state={s} />{/each}</div>
