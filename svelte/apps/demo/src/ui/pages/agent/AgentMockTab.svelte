<script lang="ts">
  import '@microcks/demo-styles/pages/agent/agent-mock.css';
  import { SSE_SAMPLE, pushSample, transportSample, transportStreamingNote, type AgentProfile, type CallMode } from '@microcks/demo-core/domain/agents';
  import { CodeBlock, CopyButton, Icon, Input, Segmented } from '@microcks/deep-ink';

  /** The three bindings of a2a.proto, served at once by the mock, with a ready-to-paste call for each. */
  let { agent }: { agent: AgentProfile } = $props();
  let mode = $state<CallMode>('unary');
  const jsonrpc = $derived(agent.transports.find((t) => t.id === 'jsonrpc'));
  const method = $derived(mode === 'stream' ? 'SendStreamingMessage' : 'SendMessage');
  const push = $derived(pushSample(jsonrpc?.mockUrl ?? ''));
</script>

<div class="agent-mock"
  ><div class="agent-mock-intro"
    ><p
      >The three bindings of <span class="demo-mono">a2a.proto</span> are served at once, from the same conversations. Every request carries<!---->{' '}<span
        class="agent-mock-version">A2A-Version: 1.0</span
      >; another version gets <span class="demo-mono">VersionNotSupportedError</span>.</p
    ><Segmented
      variant="joined"
      size="sm"
      label="Call"
      value={mode}
      onchange={(v) => (mode = v as CallMode)}
      options={[{ id: 'unary', label: 'SendMessage' }, { id: 'stream', label: 'SendStreamingMessage' }]}
    /></div
  ><div class="agent-transports"
    >{#each agent.transports as t (t.id)}<section
        class="agent-card-panel agent-transport"
        data-preferred={t.preferred ? '' : undefined}
        aria-labelledby={`tr-${t.id}`}
        ><div class="agent-transport-head"
          ><h2 id={`tr-${t.id}`}>{t.name}</h2><span class="agent-binding">{t.binding}</span>{#if t.preferred}<span class="agent-preferred"
              >preferred · first interface</span
            >{/if}</div
        ><div class="agent-transport-url"
          ><label for={`url-${t.id}`}>{t.urlLabel}</label><div class="agent-transport-url-row"
            ><Input id={`url-${t.id}`} mono readonly value={t.mockUrl} class="agent-url-input" /><CopyButton
              value={t.mockUrl}
              label="Copy"
              size="compact"
              class="agent-copy-plain agent-url-copy"
              aria-label={`Copy the ${t.name} URL`}
            /></div
          ></div
        ><p class="agent-transport-stream"
          ><Icon name="activity" size={13} class="agent-stream-icon" /><span>{transportStreamingNote(t, mode)}</span></p
        ><CodeBlock
          class="agent-transport-sample agent-panel-code"
          code={transportSample(t, mode)}
          language="bash"
          caption={`${method} · ${t.id === 'grpc' ? 'grpcurl' : 'curl'}`}
          label={`${method} · ${t.id === 'grpc' ? 'grpcurl' : 'curl'}, ${t.name} binding`}
        /><div class="agent-also"><span class="agent-also-label">Also served</span><span class="agent-also-list">{t.more}</span></div></section
      >{/each}</div
  >{#if mode === 'stream'}<section class="agent-card-panel" aria-labelledby="agent-stream-title"
      ><div class="agent-panel-head"
        ><h2 id="agent-stream-title">What the stream returns</h2><span class="agent-panel-note"
          >HTTP+JSON shape for <span class="demo-mono">ord-2417-ready</span>, paced by the task script. JSON-RPC wraps each event in <span
            class="demo-mono">result</span
          >.</span
        ></div
      ><CodeBlock class="agent-panel-code" code={SSE_SAMPLE} variant="plain" copy={false} caption="text/event-stream" /></section
    >{/if}<div class="agent-mock-foot"
    ><section class="agent-card-panel agent-push" aria-labelledby="agent-push-title"
      ><div class="agent-panel-head" data-split=""
        ><h2 id="agent-push-title">Push notifications</h2><CopyButton
          value={push}
          label="Copy"
          variant="link"
          aria-label="Copy the push notification request"
        /></div
      ><p class="agent-panel-text">Register a webhook on a task; the mock posts each status and artifact update to it, following the script timing.</p
      ><CodeBlock class="agent-panel-code" code={push} language="bash" variant="plain" copy={false} caption="CreateTaskPushNotificationConfig" /><p
        class="agent-webhook"
        ><span class="ex-muted">1 registered webhook</span><span class="agent-webhook-url">{agent.webhook.url}</span><span class="agent-webhook-ok"
          ><Icon name="check" size={12} />last delivery <!---->{agent.webhook.lastDelivery}</span
        ></p
      ></section
    ><section class="agent-card-panel agent-answers" aria-labelledby="agent-answers-title"
      ><h2 id="agent-answers-title">How the mock answers</h2><div role="note" class="agent-note"
        ><Icon name="ban" size={15} class="agent-note-icon" /><span
          >Unmatched messages answer a task in state <span class="demo-mono">rejected</span>, not an HTTP error.</span
        ></div
      ><ul class="agent-answers-list"
        ><li
          >A transport success can carry a task in state <span class="demo-mono">failed</span>. Check the HTTP status and the task state separately.</li
        ><li
          >An <span class="demo-mono">input-required</span> task resumes when the next message carries the same <span class="demo-mono">taskId</span> and <span
            class="demo-mono">contextId</span
          >.</li
        ><li
          ><span class="demo-mono">CancelTask</span> moves a live task to <span class="demo-mono">canceled</span>; on a terminal task it returns <span
            class="demo-mono">TaskNotCancelableError</span
          >.</li
        ></ul
      ></section
    ></div
  ></div
>
