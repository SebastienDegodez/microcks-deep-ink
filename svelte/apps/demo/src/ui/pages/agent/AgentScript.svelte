<script lang="ts">
  import type { Conversation, ScriptPart, ScriptStep } from '@microcks/demo-core/domain/agents';
  import { Icon, TaskStateTag, TaskTimeline } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { stateIndices, timelineNodes } from './skills';

  /** The task script of one conversation: its lifecycle timeline, then each step. */
  let { conversation, serviceLink }: { conversation: Conversation; serviceLink?: string | undefined } = $props();
  const titleId = $props.id();
  let node = $state<number | undefined>();
  const stateIdx = $derived(stateIndices(conversation));
  const nodes = $derived(timelineNodes(conversation));
  const selectedStep = $derived(node === undefined ? undefined : stateIdx[node]);
</script>

{#snippet part(p: ScriptPart)}<div class="agent-part"
    ><span class="agent-part-label">{p.kind === 'text' ? 'text part · text/plain' : 'data part · application/json'}</span
    >{#if p.kind === 'text'}<span class="agent-part-text">{p.text}</span>{:else}<pre class="agent-part-data">{p.body}</pre>{/if}</div
  >{/snippet}

{#snippet stepBody(step: ScriptStep, streamed: boolean)}{#if step.kind === 'state'}<span class="agent-step-line"
      ><TaskStateTag state={step.state} />{#if streamed && step.event}<span class="agent-step-event">{step.event}</span>{/if}</span
    >{#if step.message}<div class="agent-bubble" data-role="agent"
        ><span class="agent-bubble-head">agent · status.message</span><span class="agent-part-text">{step.message}</span></div
      >{/if}{:else if step.kind === 'user'}<div class="agent-bubble" data-role="user"
      ><span class="agent-bubble-head"
        ><span class="agent-bubble-who">user · <!---->{step.messageId}</span><span>{step.meta}</span></span
      >{#each step.parts as p, i (i)}{@render part(p)}{/each}</div
    >{:else if step.kind === 'call'}<div class="agent-call"
      ><Icon name="swap" size={14} /><span>Agent calls</span>{#if serviceLink}<RouterLink class="agent-call-link" to={serviceLink}
          >API Pastry 2.0</RouterLink
        >{:else}<span class="agent-call-link">API Pastry 2.0</span>{/if}<span class="agent-call-path">{step.text}</span><span
        class="agent-call-status">200</span
      ><span class="agent-call-note">served by its Microcks mock</span></div
    >{:else if step.kind === 'turn'}<div class="agent-turn"
      ><span class="agent-turn-title">{step.title}</span><span class="agent-turn-text">{step.text}</span></div
    >{:else if step.kind === 'artifact'}<div class="agent-artifact"
      ><div class="agent-artifact-head"
        ><Icon name="file" size={14} class="agent-artifact-icon" /><span class="agent-artifact-name">{step.name}</span><span
          class="agent-artifact-id">artifactId <!---->{step.artifactId}</span
        ><span class="agent-artifact-event">{streamed ? 'TaskArtifactUpdateEvent' : 'task.artifacts'}</span></div
      >{#each step.parts as p, i (i)}<div class="agent-artifact-part">{@render part(p)}</div>{/each}</div
    >{:else if step.kind === 'chunks'}<div class="agent-chunks"
      ><div class="agent-chunks-head"
        ><Icon name="file" size={14} class="agent-artifact-icon" /><span class="agent-artifact-name">{step.name}</span><span
          class="agent-artifact-id"
          >artifactId <!---->{step.artifactId}<!----> · streamed in <!---->{step.chunks.length}<!----> chunks</span
        ><span class="agent-artifact-event">TaskArtifactUpdateEvent</span></div
      ><ol class="agent-chunk-list" aria-label={`Chunks of ${step.name}`}
        >{#each step.chunks as c, j (c.n)}<li class="agent-chunk" data-last={c.last ? '' : undefined} style:margin-inline-start={`${j * 18}px`}
            ><span class="agent-chunk-at">chunk <!---->{c.n}<!----> · <!---->{c.at}</span><span class="agent-chunk-text"
              >“<!---->{c.text}<!---->”</span
            ><span class="agent-chunk-flags"
              ><span class="agent-flag" data-on={c.append ? '' : undefined} data-tone="a2a">append: <!---->{String(c.append)}</span><span
                class="agent-flag"
                data-on={c.last ? '' : undefined}
                data-tone="success">lastChunk: <!---->{String(c.last)}</span
              ></span
            ></li
          >{/each}</ol
      ><span class="agent-chunks-note"
        >Assembled artifact: parts <span class="agent-chunks-parts">[<!---->{step.chunks.map((c) => `"${c.text}"`).join(', ')}<!---->]</span
        >. The stream closes on <span class="demo-mono">lastChunk: true</span>, then the final status update.</span
      ></div
    >{/if}{/snippet}

<div role="group" aria-labelledby={titleId} class="agent-script-box"
  ><div class="agent-script-head"
    ><span class="agent-script-title"><h3 id={titleId}>Task script</h3><span class="agent-script-id">{conversation.id}</span></span><span
      class="agent-script-length">{conversation.method}<!----> · <!---->{conversation.length}</span
    ></div
  ><div class="agent-script-meta"
    ><span>contextId <span class="agent-script-value">{conversation.contextId}</span></span><span
      >taskId <span class="agent-script-value">{conversation.taskId}</span></span
    ><span>{conversation.turns > 1 ? 'multi-turn: both turns share contextId and taskId' : 'single turn'}</span><span
      >match: <span class="agent-script-match">{conversation.match}</span></span
    ></div
  ><TaskTimeline label={`Lifecycle of ${conversation.id}`} {nodes} selectedIndex={node} onselectnode={(i) => (node = i)} /><ol
    class="agent-script"
    aria-label={`Script of ${conversation.id}`}
    >{#each conversation.steps as step, i (i)}<li data-kind={step.kind} data-selected={selectedStep === i ? '' : undefined}
        ><span class="agent-at">{step.at}</span><div class="agent-step" data-align={step.kind === 'user' ? 'end' : undefined}
          >{@render stepBody(step, conversation.streamed)}</div
        ></li
      >{/each}</ol
  ></div
>
