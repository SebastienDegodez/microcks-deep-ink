import { useState } from 'react';
import { getTaskJson, isTerminalTaskState, taskStateWire, type AgentTask } from '@/domain/agents';
import { useAnnounce, useSubscription, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { TaskStateTag } from '@/ui/components/ui/task-timeline';

const ago = (s: number): string => (s < 3 ? 'just now' : s < 60 ? `${s} s ago` : s < 3600 ? `${Math.floor(s / 60)} min ago` : `${Math.floor(s / 3600)} h ago`);

/** Tasks created on the mock, streamed from the use case (1 s tick). */
export function AgentTasksTab({ serviceId, initial, onChanged }: { serviceId: string; initial: AgentTask[] | undefined; onChanged: () => void }) {
  const uc = useUseCases();
  const announce = useAnnounce();
  const live = useSubscription<AgentTask[], AgentTask[]>((listener) => uc.agents.subscribeTasks(serviceId, listener), [uc, serviceId], { initial: initial ?? [] });
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [showGet, setShowGet] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const tasks = live.value.length > 0 ? live.value : (initial ?? []);
  const task = tasks.find((t) => t.id === selectedId) ?? tasks[0];
  const open = tasks.filter((t) => !isTerminalTaskState(t.state)).length;

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
    <div className="ex-stack">
      <div className="ex-row-between">
        <div>
          <h2 style={{ margin: 0 }}>Tasks created on the mock</h2>
          <p className="ex-small ex-secondary" style={{ margin: 0 }}>Kept 24 h · same list as <span className="ex-mono">ListTasks</span> on any transport</p>
        </div>
        <span className="ex-row">
          <LiveIndicator label={`${tasks.length} tasks in the last 24 h · ${open} not terminal`} />
          <Button variant="secondary" aria-pressed={live.paused} onClick={live.toggle}>{live.paused ? 'Resume' : 'Pause'}</Button>
        </span>
      </div>
      <div className="ag-table-wrap">
        <table className="ag-table">
          <caption className="sr-only">Tasks of the mock, newest first. Select a task id to see its detail.</caption>
          <thead>
            <tr><th scope="col">Task</th><th scope="col">contextId</th><th scope="col">Skill</th><th scope="col">State</th><th scope="col">Transport</th><th scope="col">Client</th><th scope="col">Updated</th></tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} data-selected={t.id === task?.id ? '' : undefined}>
                <th scope="row">
                  <button type="button" className="ag-pickbtn" aria-pressed={t.id === task?.id} onClick={() => { setSelectedId(t.id); setCancelError(''); }}>{t.id}</button>
                </th>
                <td className="ex-mono">{t.contextId}</td>
                <td className={t.skillId ? 'ex-mono' : 'ex-muted'}>{t.skillId || '— no match'}</td>
                <td><TaskStateTag state={t.state} /></td>
                <td>{t.transport}</td>
                <td>{t.client}</td>
                <td>{ago(t.updatedSecondsAgo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {task ? (
        <section className="ex-stack" aria-label={`Detail of ${task.id}`}>
          <div className="ex-row-between">
            <h3 style={{ margin: 0 }}><span className="ex-mono">{task.id}</span> <TaskStateTag state={task.state} /></h3>
            <span className="ex-row">
              <Button variant="secondary" aria-expanded={showGet} onClick={() => setShowGet((v) => !v)}>GetTask</Button>
              <Button variant="danger" disabled={isTerminalTaskState(task.state)} onClick={cancel}>CancelTask</Button>
            </span>
          </div>
          <p className="ex-small ex-secondary" style={{ margin: 0 }}>
            {task.skillId ? `skill ${task.skillId}` : 'no skill matched'} · {task.transport} · <span className="ex-mono">{task.method}</span> · {task.client} · wire state <span className="ex-mono">{taskStateWire(task.state)}</span>
          </p>
          <p className="ex-small ex-secondary" style={{ margin: 0 }}>
            {isTerminalTaskState(task.state) ? `TaskNotCancelableError: ${task.id} is ${task.state}.` : 'Moves the task to canceled and notifies its webhook.'}
          </p>
          {cancelError ? <p role="alert" className="ex-small">{cancelError}</p> : null}
          <h4 style={{ margin: 0 }}>History · {task.history.length} {task.history.length === 1 ? 'message' : 'messages'}</h4>
          <ul className="ex-plain-list" aria-label="History">
            {task.history.map((h, i) => (
              <li key={i} className="ag-part"><span className="ex-small ex-muted">{h.role === 'system' ? 'status change' : h.role}</span><p style={{ margin: 0 }}>{h.text}</p></li>
            ))}
          </ul>
          <h4 style={{ margin: 0 }}>Artifacts · {task.artifacts.length}</h4>
          {task.artifacts.length === 0 ? (
            <p className="ex-small ex-secondary" style={{ margin: 0 }}>
              {task.state === 'input-required' ? 'None yet: the task waits for the size before it produces the order.' : !isTerminalTaskState(task.state) ? 'None yet: the first chunk arrives with the script timing.' : 'This task ended without an artifact.'}
            </p>
          ) : task.artifacts.map((a) => (
            <CodeBlock key={a.id} code={a.body} language="json" caption={`${a.name} · ${a.id}${a.note ? ` · ${a.note}` : ''}`} />
          ))}
          {showGet ? (
            <CodeBlock
              code={getTaskJson({ id: task.id, contextId: task.contextId, state: task.state, timestamp: task.updatedAt, history: task.history, artifacts: task.artifacts })}
              language="json"
              caption={`GetTask · ${task.transport} · {"id":"${task.id}","historyLength":10}`}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
