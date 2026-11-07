import './agent-mock.css';
import { useState } from 'react';
import { SSE_SAMPLE, pushSample, transportSample, transportStreamingNote, type AgentProfile, type CallMode } from '@/domain/agents';
import { CodeBlock, CopyButton, Icon, Input, Segmented } from '@microcks/deep-ink';

/** The three bindings of a2a.proto, served at once by the mock, with a ready-to-paste call for each. */
export function AgentMockTab({ agent }: { agent: AgentProfile }) {
  const [mode, setMode] = useState<CallMode>('unary');
  const jsonrpc = agent.transports.find((t) => t.id === 'jsonrpc');
  const method = mode === 'stream' ? 'SendStreamingMessage' : 'SendMessage';
  const push = pushSample(jsonrpc?.mockUrl ?? '');
  return (
    <div className="agent-mock">
      <div className="agent-mock-intro">
        <p>
          The three bindings of <span className="demo-mono">a2a.proto</span> are served at once, from the same conversations. Every request carries{' '}
          <span className="agent-mock-version">A2A-Version: 1.0</span>; another version gets <span className="demo-mono">VersionNotSupportedError</span>.
        </p>
        <Segmented
          variant="joined"
          size="sm"
          label="Call"
          value={mode}
          onChange={(v) => setMode(v as CallMode)}
          options={[{ id: 'unary', label: 'SendMessage' }, { id: 'stream', label: 'SendStreamingMessage' }]}
        />
      </div>
      <div className="agent-transports">
        {agent.transports.map((t) => (
          <section key={t.id} className="agent-card-panel agent-transport" data-preferred={t.preferred ? '' : undefined} aria-labelledby={`tr-${t.id}`}>
            <div className="agent-transport-head">
              <h2 id={`tr-${t.id}`}>{t.name}</h2>
              <span className="agent-binding">{t.binding}</span>
              {t.preferred ? <span className="agent-preferred">preferred · first interface</span> : null}
            </div>
            <div className="agent-transport-url">
              <label htmlFor={`url-${t.id}`}>{t.urlLabel}</label>
              <div className="agent-transport-url-row">
                <Input id={`url-${t.id}`} mono readOnly value={t.mockUrl} className="agent-url-input" />
                <CopyButton value={t.mockUrl} label="Copy" size="compact" className="agent-copy-plain agent-url-copy" aria-label={`Copy the ${t.name} URL`} />
              </div>
            </div>
            <p className="agent-transport-stream">
              <Icon name="activity" size={13} className="agent-stream-icon" />
              <span>{transportStreamingNote(t, mode)}</span>
            </p>
            <CodeBlock className="agent-transport-sample agent-panel-code" code={transportSample(t, mode)} language="bash" caption={`${method} · ${t.id === 'grpc' ? 'grpcurl' : 'curl'}`} label={`${method} · ${t.id === 'grpc' ? 'grpcurl' : 'curl'}, ${t.name} binding`} />
            <div className="agent-also">
              <span className="agent-also-label">Also served</span>
              <span className="agent-also-list">{t.more}</span>
            </div>
          </section>
        ))}
      </div>
      {mode === 'stream' ? (
        <section className="agent-card-panel" aria-labelledby="agent-stream-title">
          <div className="agent-panel-head">
            <h2 id="agent-stream-title">What the stream returns</h2>
            <span className="agent-panel-note">
              HTTP+JSON shape for <span className="demo-mono">ord-2417-ready</span>, paced by the task script. JSON-RPC wraps each event in <span className="demo-mono">result</span>.
            </span>
          </div>
          <CodeBlock className="agent-panel-code" code={SSE_SAMPLE} variant="plain" copy={false} caption="text/event-stream" />
        </section>
      ) : null}
      <div className="agent-mock-foot">
        <section className="agent-card-panel agent-push" aria-labelledby="agent-push-title">
          <div className="agent-panel-head" data-split="">
            <h2 id="agent-push-title">Push notifications</h2>
            <CopyButton value={push} label="Copy" variant="link" aria-label="Copy the push notification request" />
          </div>
          <p className="agent-panel-text">Register a webhook on a task; the mock posts each status and artifact update to it, following the script timing.</p>
          <CodeBlock className="agent-panel-code" code={push} language="bash" variant="plain" copy={false} caption="CreateTaskPushNotificationConfig" />
          <p className="agent-webhook">
            <span className="ex-muted">1 registered webhook</span>
            <span className="agent-webhook-url">{agent.webhook.url}</span>
            <span className="agent-webhook-ok"><Icon name="check" size={12} />last delivery {agent.webhook.lastDelivery}</span>
          </p>
        </section>
        <section className="agent-card-panel agent-answers" aria-labelledby="agent-answers-title">
          <h2 id="agent-answers-title">How the mock answers</h2>
          <div role="note" className="agent-note">
            <Icon name="ban" size={15} className="agent-note-icon" />
            <span>Unmatched messages answer a task in state <span className="demo-mono">rejected</span>, not an HTTP error.</span>
          </div>
          <ul className="agent-answers-list">
            <li>A transport success can carry a task in state <span className="demo-mono">failed</span>. Check the HTTP status and the task state separately.</li>
            <li>An <span className="demo-mono">input-required</span> task resumes when the next message carries the same <span className="demo-mono">taskId</span> and <span className="demo-mono">contextId</span>.</li>
            <li><span className="demo-mono">CancelTask</span> moves a live task to <span className="demo-mono">canceled</span>; on a terminal task it returns <span className="demo-mono">TaskNotCancelableError</span>.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
