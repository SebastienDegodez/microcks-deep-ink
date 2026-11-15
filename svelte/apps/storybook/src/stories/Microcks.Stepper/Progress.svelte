<script lang="ts">
import { Stepper } from '@microcks/deep-ink';


</script>
<div style="display: flex; flex-direction: column; gap: 20px"><Stepper label="Progress" steps={[{ label: 'Source', state: 'current' }, { label: 'Preview' }, { label: 'Live mock' }]} /><Stepper label="Progress" steps={[{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'current' }, { label: 'Live mock' }]} /><Stepper label="Progress" steps={[{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'done' }, { label: 'Live mock', state: 'done' }]} /></div>
