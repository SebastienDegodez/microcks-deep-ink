<script lang="ts">
  import '@microcks/demo-styles/pages/agent/agent-tasks.css';
  import { getTaskJson, isTerminalTaskState, type AgentTask } from '@microcks/demo-core/domain/agents';
  import { Button, CodeBlock, LiveIndicator, TaskStateTag } from '@microcks/deep-ink';
  import { useAnnounce, useSubscription, useUseCases } from '@/ui/app';
  import { ago } from '@/ui/app/format';
  import { INITIAL_TASK_ID, cancelNote, getTaskCaption, historyRole, noArtifactText } from './tasks';

  /** Tasks created on the mock, streamed from the use case (1 s tick). */
  let { serviceId, initial, onchanged }: { serviceId: string; initial: AgentTask[] | undefined; onchanged: () => void } = $props();
  const uc = useUseCases();
  const announce = useAnnounce();
  const live = useSubscription<AgentTask[], AgentTask[]>((listener) => uc.agents.subscribeTasks(serviceId, listener), () => [uc, serviceId], () => ({
    initial: initial ?? [],
  }));
  let selectedId = $state<string | undefined>(INITIAL_TASK_ID);
  let showGet = $state(false);
  let cancelError = $state('');
  // Until the first tick of the watch, and right after a cancel, the page's own query fills the table.
  const tasks = $derived(live.value.length > 0 ? live.value : (initial ?? []));
  const task = $derived(tasks.find((t) => t.id === selectedId) ?? tasks[0]);
  const open = $derived(tasks.filter((t) => !isTerminalTaskState(t.state)).length);
  const terminal = $derived(task ? isTerminalTaskState(task.state) : true);

  const cancel = async () => {
    const current = task;
    if (!current) return;
    try {
      const done = await uc.agents.cancelTask(serviceId, current.id, 'MA');
      cancelError = '';
      announce(`Task ${done.id} canceled.`);
      onchanged();
    } catch (error) {
      cancelError = error instanceof Error ? error.message : String(error);
    }
  };
</script>

<div class="agent-tasks"
  ><div class="agent-tasks-head"
    ><div class="agent-tasks-title"
      ><h2>Tasks created on the mock</h2><LiveIndicator variant="inline" paused={live.paused} label="live" /><span class="agent-tasks-summary"
        >{tasks.length}<!----> tasks in the last 24 h · <!---->{open}<!----> not terminal</span
      ><!-- Updates every second: a pause control keeps it under the user's control (WCAG 2.2.2). --><Button
        variant="link"
        size="sm"
        onclick={live.toggle}>{live.paused ? 'Resume' : 'Pause'}</Button
      ></div
    ><span class="agent-tasks-kept">Kept 24 h · same list as <span class="demo-mono">ListTasks</span> on any transport</span></div
  ><div class="agent-task-table-wrap"
    ><table class="agent-task-table"
      ><caption class="sr-only">Tasks of the mock, newest first. Select a task id to see its detail.</caption
      ><thead
        ><tr><th scope="col">Task</th><th scope="col">contextId</th><th scope="col">Skill</th><th scope="col">State</th><th scope="col">Transport</th><th scope="col">Client</th><th scope="col" data-align="end">Updated</th></tr
        ></thead
      ><tbody
        >{#each tasks as t (t.id)}<tr data-selected={t.id === task?.id ? '' : undefined}
            ><th scope="row"
              ><button
                type="button"
                class="agent-task-pick"
                aria-pressed={t.id === task?.id}
                onclick={() => {
                  selectedId = t.id;
                  cancelError = '';
                }}
                ><!-- The dot only: the hidden "(live)" after the button keeps the button named by the task id. -->{#if t.live}<LiveIndicator
                    variant="dot"
                    label=""
                  />{/if}{t.id}</button
              >{#if t.live}<span class="sr-only">{' (live)'}</span>{/if}</th
            ><td class="agent-task-ctx">{t.contextId}</td><td class="agent-task-skill" data-none={t.skillId ? undefined : ''}
              >{t.skillId || '— no match'}</td
            ><td><TaskStateTag state={t.state} /></td><td class="agent-task-transport">{t.transport}</td><td class="agent-task-client"
              >{t.client}</td
            ><td class="agent-task-updated" data-align="end" data-now={t.updatedSecondsAgo < 3 ? '' : undefined}>{ago(t.updatedSecondsAgo)}</td
            ></tr
          >{/each}</tbody
      ></table
    ></div
  >{#if task}<section class="agent-task-detail" aria-label={`Detail of ${task.id}`}
      ><div class="agent-task-detail-head"
        ><div class="agent-task-detail-text"
          ><div class="agent-task-detail-title"><h3>{task.id}</h3><TaskStateTag state={task.state} /></div><span class="agent-task-meta"
            >contextId <span class="agent-task-meta-value">{task.contextId}</span> · <!---->{task.skillId
              ? `skill ${task.skillId}`
              : 'no skill matched'}<!----> · <!---->{task.transport}<!----> · <!---->{task.method}<!----> · <!---->{task.client}</span
          ></div
        ><div class="agent-task-actions"
          ><div class="agent-task-buttons"
            ><Button
              variant="secondary"
              size="compact"
              icon="arrow-to-end"
              class="agent-task-method"
              aria-expanded={showGet}
              onclick={() => (showGet = !showGet)}>GetTask</Button
            ><Button
              variant="danger"
              size="compact"
              icon="stop-circle"
              class="agent-task-method"
              disabled={terminal}
              aria-describedby="agent-cancel-note"
              onclick={cancel}>CancelTask</Button
            ></div
          ><span id="agent-cancel-note" class="agent-task-note">{cancelNote(task)}</span></div
        ></div
      >{#if cancelError}<p role="alert" class="agent-task-note">{cancelError}</p>{/if}{#if showGet}<CodeBlock
          code={getTaskJson({
            id: task.id,
            contextId: task.contextId,
            state: task.state,
            timestamp: task.updatedAt,
            history: task.history,
            artifacts: task.artifacts,
          })}
          language="json"
          caption={getTaskCaption(task)}
          maxHeight={360}
        />{/if}<div class="agent-task-cols"
        ><div class="agent-task-history"
          ><h4
            >History <span class="agent-h4-note"
              >· <!---->{task.history.length}<!---->{' '}<!---->{task.history.length === 1 ? 'message' : 'messages'}</span
            ></h4
          ><ul class="agent-history" aria-label="History"
            >{#each task.history as h, i (i)}<li data-role={h.role}
                ><div class="agent-history-msg"
                  ><span class="agent-history-role">{historyRole(h.role)}</span><span class="agent-history-text">{h.text}</span></div
                ></li
              >{/each}</ul
          ></div
        ><div class="agent-task-artifacts"
          ><h4>Artifacts <span class="agent-h4-note">· <!---->{task.artifacts.length}</span></h4
          >{#if task.artifacts.length === 0}<p class="agent-task-empty">{noArtifactText(task)}</p>{:else}{#each task.artifacts as a (a.id)}<div
                class="agent-task-artifact"
                ><div class="agent-task-artifact-head"
                  ><span class="agent-task-artifact-name">{a.name}</span><span class="agent-task-artifact-id">{a.id}</span>{#if a.note}<span
                      class="agent-task-artifact-note"
                      data-done={a.note === 'lastChunk true' ? '' : undefined}>{a.note}</span
                    >{/if}</div
                ><pre class="agent-task-artifact-body">{a.body}</pre></div
              >{/each}{/if}</div
        ></div
      ></section
    >{/if}</div
>
