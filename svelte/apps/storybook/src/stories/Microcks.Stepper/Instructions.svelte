<script lang="ts">
import { Stepper } from '@microcks/deep-ink';


</script>
<div style="max-width: 360px"><Stepper label="Before you paste" variant="list" steps={[
          { label: 'Add MICROCKS_URL and the service account secret to the repository settings.' },
          { label: 'Paste the job in .github/workflows/contract-tests.yml and push.' },
        ]} /></div>
