<script lang="ts">
import { Button } from '@microcks/deep-ink';
import { CiPanel } from '@microcks/deep-ink';
import { ProjectionPill } from '@microcks/deep-ink';
const CMD = "microcks test 'Pastry Concierge:1.0' https://concierge.acme.io/a2a A2A_CONFORMANCE \\\n  --microcksURL=https://microcks.acme.io/api/ --waitFor=30sec";
let open = $state(true);
</script>
<div class="stack" style="max-width: 720px"><div class="inline"><Button class="ci-panel-toggle" icon="code" aria-expanded={open} aria-controls="sb-ci" onclick={() => open = !open}>Run it from CI</Button></div>{#if open}<CiPanel id="sb-ci" dashed title="Run this test in your pipeline" hint="Proposed, not available today: the existing microcks test command with the new runner name. It exits non-zero when a check fails." command={CMD} copyLabel="Copy command" footnote="Add --keycloakClientId and --keycloakClientSecret when your Microcks instance has authentication on.">{#snippet pill()}<ProjectionPill>Projection · proposed CLI</ProjectionPill>{/snippet}</CiPanel>{/if}</div>
