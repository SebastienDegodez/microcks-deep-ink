import '@microcks/demo-styles/pages/agent/agent-tasks.css';
import { useState } from 'react';
import { getTaskJson, isTerminalTaskState, type AgentTask } from '@/domain/agents';
import { ago } from '@/ui/app/format';
import { useAnnounce, useSubscription, useUseCases } from '@/ui/app';
import { Button, CodeBlock, LiveIndicator, TaskStateTag } from '@microcks/deep-ink';


/** Tasks created on the mock, streamed from the use case (1 s tick). */
export function AgentTasksTab({ serviceId, initial, onChanged }: { serviceId: string; initial: AgentTask[] | undefined; onChanged: () => void }) {
  const uc = useUseCases();
  const announce = useAnnounce();
  const live = useSubscription<AgentTask[], AgentTask[]>((listener) => uc.agents.subscribeTasks(serviceId, listener), [uc, serviceId], { initial: initial ?? [] });
  const [selectedId, setSelectedId] = useState<string | undefined>('task-9a04');
  const [showGet, setShowGet] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const tasks = live.value.length > 0 ? live.value : (initial ?? []);
  const task = tasks.find((t) => t.id === selectedId) ?? tasks[0];
  const open = tasks.filter((t) => !isTerminalTaskState(t.state)).length;
  const terminal = task ? isTerminalTaskState(task.state) : true;

  const cancel = async () => {
    if (!task) return;
    try {
      const done = await uc.agents.cancelTask(serviceId, task.id, 'MA');
      setCancelError('');
      announce(`Task ${done.id} canceled.`);
      onChanged();
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="agent-tasks">
      <div className="agent-tasks-head">
        <div className="agent-tasks-title">
          <h2>Tasks created on the mock</h2>
          <LiveIndicator variant="inline" paused={live.paused} label="live" />
          <span className="agent-tasks-summary">{tasks.length} tasks in the last 24 h · {open} not terminal</span>
          {/* Updates every second: a pause control keeps it under the user's control (WCAG 2.2.2). */}
          <Button variant="link" size="sm" onClick={live.toggle}>{live.paused ? 'Resume' : 'Pause'}</Button>
        </div>
        <span className="agent-tasks-kept">Kept 24 h · same list as <span className="demo-mono">ListTasks</span> on any transport</span>
      </div>
      <div className="agent-task-table-wrap">
        <table className="agent-task-table">
          <caption className="sr-only">Tasks of the mock, newest first. Select a task id to see its detail.</caption>
          <thead>
            <tr><th scope="col">Task</th><th scope="col">contextId</th><th scope="col">Skill</th><th scope="col">State</th><th scope="col">Transport</th><th scope="col">Client</th><th scope="col" data-align="end">Updated</th></tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} data-selected={t.id === task?.id ? '' : undefined}>
                <th scope="row">
                  <button type="button" className="agent-task-pick" aria-pressed={t.id === task?.id} onClick={() => { setSelectedId(t.id); setCancelError(''); }}>
                    {/* The dot only: the hidden "(live)" after the button keeps the button named by the task id. */}
                    {t.live ? <LiveIndicator variant="dot" label="" /> : null}
                    {t.id}
                  </button>
                  {t.live ? <span className="sr-only"> (live)</span> : null}
                </th>
                <td className="agent-task-ctx">{t.contextId}</td>
                <td className="agent-task-skill" data-none={t.skillId ? undefined : ''}>{t.skillId || '— no match'}</td>
                <td><TaskStateTag state={t.state} /></td>
                <td className="agent-task-transport">{t.transport}</td>
                <td className="agent-task-client">{t.client}</td>
                <td className="agent-task-updated" data-align="end" data-now={t.updatedSecondsAgo < 3 ? '' : undefined}>{ago(t.updatedSecondsAgo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {task ? (
        <section className="agent-task-detail" aria-label={`Detail of ${task.id}`}>
          <div className="agent-task-detail-head">
            <div className="agent-task-detail-text">
              <div className="agent-task-detail-title">
                <h3>{task.id}</h3>
                <TaskStateTag state={task.state} />
              </div>
              <span className="agent-task-meta">
                contextId <span className="agent-task-meta-value">{task.contextId}</span> · {task.skillId ? `skill ${task.skillId}` : 'no skill matched'} · {task.transport} · {task.method} · {task.client}
              </span>
            </div>
            <div className="agent-task-actions">
              <div className="agent-task-buttons">
                <Button variant="secondary" size="compact" icon="arrow-to-end" className="agent-task-method" aria-expanded={showGet} onClick={() => setShowGet((v) => !v)}>GetTask</Button>
                <Button variant="danger" size="compact" icon="stop-circle" className="agent-task-method" disabled={terminal} aria-describedby="agent-cancel-note" onClick={cancel}>CancelTask</Button>
              </div>
              <span id="agent-cancel-note" className="agent-task-note">
                {terminal ? `TaskNotCancelableError: ${task.id} is ${task.state}.` : 'Moves the task to canceled and notifies its webhook.'}
              </span>
            </div>
          </div>
          {cancelError ? <p role="alert" className="agent-task-note">{cancelError}</p> : null}
          {showGet ? (
            <CodeBlock
              code={getTaskJson({ id: task.id, contextId: task.contextId, state: task.state, timestamp: task.updatedAt, history: task.history, artifacts: task.artifacts })}
              language="json"
              caption={`GetTask · ${task.transport} · {"id":"${task.id}","historyLength":10} · 200 OK`}
              maxHeight={360}
            />
          ) : null}
          <div className="agent-task-cols">
            <div className="agent-task-history">
              <h4>History <span className="agent-h4-note">· {task.history.length} {task.history.length === 1 ? 'message' : 'messages'}</span></h4>
              <ul className="agent-history" aria-label="History">
                {task.history.map((h, i) => (
                  <li key={i} data-role={h.role}>
                    <div className="agent-history-msg">
                      <span className="agent-history-role">{h.role === 'system' ? 'status change' : h.role}</span>
                      <span className="agent-history-text">{h.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="agent-task-artifacts">
              <h4>Artifacts <span className="agent-h4-note">· {task.artifacts.length}</span></h4>
              {task.artifacts.length === 0 ? (
                <p className="agent-task-empty">
                  {task.state === 'input-required' ? 'None yet: the task waits for the size before it produces the order.' : !terminal ? 'None yet: the first chunk arrives with the script timing.' : 'This task ended without an artifact.'}
                </p>
              ) : task.artifacts.map((a) => (
                <div key={a.id} className="agent-task-artifact">
                  <div className="agent-task-artifact-head">
                    <span className="agent-task-artifact-name">{a.name}</span>
                    <span className="agent-task-artifact-id">{a.id}</span>
                    {a.note ? <span className="agent-task-artifact-note" data-done={a.note === 'lastChunk true' ? '' : undefined}>{a.note}</span> : null}
                  </div>
                  <pre className="agent-task-artifact-body">{a.body}</pre>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
