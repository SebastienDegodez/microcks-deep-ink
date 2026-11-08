<script lang="ts">
import { TaskStateTag, TaskTimeline } from '@microcks/deep-ink';


</script>
<div class="sb-col"><div class="inline"><TaskStateTag state="auth-required" /><TaskStateTag state="canceled" /><TaskStateTag state="rejected" /><TaskStateTag state="completed" ghost /></div><TaskTimeline label="Cancelled task" showUnreached={false} nodes={[{ state: 'submitted', at: '09:10:01' }, { state: 'working', at: '09:10:03', connector: '2 s' }, { state: 'canceled', at: '09:10:05', connector: '2 s' }]} /></div>
