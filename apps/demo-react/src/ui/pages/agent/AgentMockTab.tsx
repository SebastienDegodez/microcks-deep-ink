import { useState } from 'react';
import { SSE_SAMPLE, pushSample, transportSample, transportStreamingNote, type AgentProfile, type CallMode } from '@/domain/agents';
import { Callout } from '@/ui/components/ui/callout';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Segmented } from '@/ui/components/ui/segmented';
import { Input } from '@/ui/components/ui/input';

/** The three bindings of a2a.proto, served at once by the mock, with a ready-to-paste call for each. */
export function AgentMockTab({ agent }: { agent: AgentProfile }) {
  const [mode, setMode] = useState<CallMode>('unary');
  const jsonrpc = agent.transports.find((t) => t.id === 'jsonrpc');
  return (
    <div className="ex-stack">
      <p style={{ margin: 0 }}>
        The three bindings of <span className="ex-mono">a2a.proto</span> are served at once, from the same conversations. Every request carries{' '}
        <span className="ex-mono">A2A-Version: 1.0</span>; another version gets <span className="ex-mono">VersionNotSupportedError</span>.
      </p>
      <Segmented
        label="Call"
        value={mode}
        onChange={(v) => setMode(v as CallMode)}
        options={[{ id: 'unary', label: 'SendMessage' }, { id: 'stream', label: 'SendStreamingMessage' }]}
      />
      <div className="ex-stack">
        {agent.transports.map((t) => (
          <section key={t.id} className="ag-transport" data-preferred={t.preferred ? '' : undefined} aria-labelledby={`tr-${t.id}`}>
            <div className="ex-row-between">
              <h2 id={`tr-${t.id}`} style={{ margin: 0, fontSize: 'var(--type-h3, 1.125rem)' }}>{t.name} <span className="ex-small ex-mono ex-muted">{t.binding}</span></h2>
              {t.preferred ? <span className="ex-small ex-secondary">preferred · first interface</span> : null}
            </div>
            <div className="ex-row">
              <label htmlFor={`url-${t.id}`} className="ex-small ex-muted">{t.urlLabel}</label>
              <Input id={`url-${t.id}`} mono readOnly value={t.mockUrl} style={{ flex: 1, minWidth: 200 }} />
              <CopyButton value={t.mockUrl} label="Copy" aria-label={`Copy the ${t.name} URL`} />
            </div>
            <p className="ex-small ex-secondary" style={{ margin: 0 }}>{transportStreamingNote(t, mode)}</p>
            <CodeBlock code={transportSample(t, mode)} language="bash" caption={`${t.name} · ${mode === 'stream' ? 'SendStreamingMessage' : 'SendMessage'} · ${t.id === 'grpc' ? 'grpcurl' : 'curl'}`} />
            <p className="ex-small ex-secondary" style={{ margin: 0 }}><strong>Also served</strong> · {t.more}</p>
          </section>
        ))}
      </div>
      {mode === 'stream' ? (
        <section className="ex-stack" aria-label="What the stream returns">
          <h2 style={{ margin: 0 }}>What the stream returns</h2>
          <p className="ex-small ex-secondary" style={{ margin: 0 }}>
            HTTP+JSON shape for <span className="ex-mono">ord-2417-ready</span>, paced by the task script. JSON-RPC wraps each event in <span className="ex-mono">result</span>. Task states use the v1.0 wire names.
          </p>
          <CodeBlock code={SSE_SAMPLE} caption="text/event-stream" />
        </section>
      ) : null}
      <section className="ex-stack" aria-label="Push notifications">
        <h2 style={{ margin: 0 }}>Push notifications</h2>
        <p className="ex-small ex-secondary" style={{ margin: 0 }}>
          Register a webhook on a task; the mock posts each status and artifact update to it, following the script timing.
        </p>
        <CodeBlock code={pushSample(jsonrpc?.mockUrl ?? '')} language="bash" caption="CreateTaskPushNotificationConfig" />
        <p className="ex-small" style={{ margin: 0 }}>
          1 registered webhook · <span className="ex-mono">{agent.webhook.url}</span> · last delivery {agent.webhook.lastDelivery}
        </p>
      </section>
      <Callout tone="info" title="How the mock answers">
        <ul>
          <li>Unmatched messages answer a task in state <span className="ex-mono">rejected</span>, not an HTTP error.</li>
          <li>A transport success can carry a task in state <span className="ex-mono">failed</span>. Check the HTTP status and the task state separately.</li>
          <li>An <span className="ex-mono">input-required</span> task resumes when the next message carries the same <span className="ex-mono">taskId</span> and <span className="ex-mono">contextId</span>.</li>
          <li><span className="ex-mono">CancelTask</span> moves a live task to <span className="ex-mono">canceled</span>; on a terminal task it returns <span className="ex-mono">TaskNotCancelableError</span>.</li>
        </ul>
      </Callout>
    </div>
  );
}
