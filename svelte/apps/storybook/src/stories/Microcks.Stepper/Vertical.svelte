<script lang="ts">
import { Stepper } from '@microcks/deep-ink';


</script>
<Stepper label="Import steps" direction="vertical" doneLabel="completed" steps={[{ label: 'Upload the contract', state: 'done' }, { label: 'Review the operations', state: 'current' }, { label: 'Publish', state: 'upcoming' }]} />
