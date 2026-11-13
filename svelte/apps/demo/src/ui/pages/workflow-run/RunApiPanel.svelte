<script lang="ts">
  import { CodeBlock, CopyButton } from '@microcks/deep-ink';
  import { runApiCommands, type RunApiBody } from './api';
  import '@microcks/demo-styles/pages/workflow-run/workflow-run.css';

  interface Props {
    hint: string;
    documentApiId: string;
    documentLabel: string;
    workflowId: string;
    mockUrl: string;
    body: RunApiBody;
    mixed?: boolean;
  }

  /**
   * "Run it from the API": the curl that launches the same run, then the Mock URL curl that plays the workflow on its
   * mocks. Both commands are pretty-printed, with a "Copy command" button.
   */
  let { hint, documentApiId, documentLabel, workflowId, mockUrl, body, mixed }: Props = $props();
  const commands = $derived(runApiCommands(documentApiId, workflowId, mockUrl, body));
</script>

<section aria-labelledby="run-api-h" class="wfr-card wfr-api"
  ><h2 id="run-api-h" class="wfr-card-title">Run it from the API</h2
  ><p class="wfr-note">{hint}</p
  ><CodeBlock class="wfr-pre" variant="plain" copy={false} language="bash" caption="curl command that launches the run" code={commands.curl} /><div
    class="wfr-api-foot"
    ><p class="wfr-note"
      >Answers 201 with the run; read it at <span class="wfr-mono">GET /api/arazzo/runs/<!---->{'{id}'}</span>. <!---->{documentApiId.slice(0, 8)}<!---->… is the documentId of <!---->{documentLabel}<!---->.</p
    ><CopyButton value={commands.curlOne} label="Copy command" variant="outline" class="wfr-copy" /></div
  >{#if mixed}<p class="wfr-note" data-tone="warning"
      >Proposed · beyond POC: a source left out of <span class="wfr-mono">implementations</span> stays on its mocks.</p
    >{/if}<div class="wfr-api-mock"
    ><h3 class="wfr-card-subtitle">Or play it on the mocks through its Mock URL</h3
    ><p class="wfr-note"
      >Microcks plays <!---->{workflowId}<!----> on its mocks and answers 200 with the workflow outputs. Each call creates a run with origin Mock URL.</p
    ><CodeBlock class="wfr-pre" data-size="sm" variant="plain" copy={false} language="bash" caption="curl command for the Mock URL" code={commands.mockCurl} /><CopyButton
      value={commands.mockOne}
      label="Copy command"
      variant="outline"
      class="wfr-copy"
    /></div
  ></section
>
