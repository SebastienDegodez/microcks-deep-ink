<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ArazzoPreview, AgentPreview, ImportPreview } from '@microcks/demo-core/domain/importing';
  import { Chip, ApiBadge, Button, Field, Icon, type IconName, ProjectionPill, MethodTag, Segmented, Select } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { pluralize } from '@/ui/app/format';
  import { agentStatus, arazzoStatus, importLabel, overlayFileName, workflowSteps } from './result';

  interface ArtifactCardProps {
    icon: IconName;
    name: string;
    origin?: string;
    status?: string;
    format?: string;
    badge: Snippet;
    extra?: Snippet;
  }

  /** Step 2: what Microcks understood of the artifact. Nothing is created yet. */
  interface Props {
    preview: ImportPreview;
    role: 'primary' | 'secondary';
    onrolechange: (role: 'primary' | 'secondary') => void;
    secret: string;
    onsecretchange: (name: string) => void;
    secretNames: { id: string; name: string }[];
    importing: boolean;
    onimport: () => void;
    oncancel: () => void;
  }

  let { preview, role, onrolechange, secret, onsecretchange, secretNames, importing, onimport, oncancel }: Props = $props();
</script>

{#snippet artifactCard({ icon, name, origin, status, format, badge, extra }: ArtifactCardProps)}<div class="artifact-card"
    ><span class="artifact-card-icon"><Icon name={icon} size={20} /></span><div class="artifact-card-text"
      ><span class="artifact-card-name">{name}</span>{#if origin}<span class="artifact-card-origin">{origin}</span>{/if}{#if status}<span
          role="status"
          class="artifact-card-status">{status}</span
        >{/if}</div
    ><div class="artifact-card-badges"
      >{#if format}<Chip><Icon name="check" size={12} />{' '}<!---->{format}</Chip>{/if}{@render badge()}{@render extra?.()}</div
    ></div
  >{/snippet}

{#snippet arazzoBody(arazzo: ArazzoPreview)}{@const steps = workflowSteps(arazzo)}{#snippet badge()}<ApiBadge
      arazzo
      name={`${arazzo.title} ${arazzo.version}`}
    />{/snippet}{@render artifactCard({
    icon: 'grid',
    name: arazzo.fileName,
    origin: preview.origin,
    status: arazzoStatus(arazzo),
    format: `Arazzo ${arazzo.arazzoVersion}`,
    badge,
  })}<div class="step-section"
    ><h3>{arazzo.workflows.length}<!----> workflows discovered · <!---->{steps}<!----> steps</h3><ul class="boxed-list"
      >{#each arazzo.workflows as w (w.workflowId)}<li
          ><span class="boxed-list-main"
            ><span class="boxed-list-title">{w.name}</span><span class="boxed-list-sub">workflowId: <!---->{w.workflowId}</span></span
          >{#if w.note}<Chip variant="outline" tone={w.blocked ? 'warning' : 'neutral'}
              >{#if w.blocked}<Icon name="warning" size={12} />{' '}{/if}{w.note}</Chip
            >{/if}<span class="boxed-list-end">{w.steps}<!----> steps</span></li
        >{/each}</ul
    ></div
  ><div class="step-section"
    ><h3>Link source descriptions to Microcks APIs · <!---->{arazzo.sources.length}<!----> of <!---->{arazzo.sources.length}<!----> linked</h3><p
      >Each step calls an operation of a source description. Link each one to an API already imported in Microcks: its operations are checked now, and its
      mocks become a run target.</p
    ><div class="sources-table"
      ><table
        ><caption class="sr-only">Source descriptions</caption><thead
          ><tr
            ><th scope="col">Source description</th><th scope="col">Declared URL</th><th scope="col">Microcks API</th><th scope="col">Step operations</th></tr
          ></thead
        ><tbody
          >{#each arazzo.sources as d (d.name)}<tr
              ><td><code>{d.name}</code> <span class="mono-sm">{d.type}</span></td><td class="mono-url">{d.url}</td><td
                ><span class="linked"
                  ><ApiBadge protocol={d.protocol} name={d.service} size="sm" /><span class="linked-word"><Icon name="check" size={12} />Linked</span><span
                    class="mono-sm">MATCHED</span
                  ></span
                ></td
              ><td><span class="ops-found"><Icon name="check-circle" size={14} class="ops-found-icon" />{d.operationsFound}</span></td></tr
            >{/each}</tbody
        ></table
      ></div
    ><p class="overlay-line"
      ><Icon name="layers" size={15} /><span
        >Linked through the <!---->{arazzo.overlay}<!----> overlay <code>{overlayFileName(arazzo)}</code>, or link them here.</span
      ></p
    ><div role="note" class="note-box" data-tone="info" style="max-width: 760px"
      ><Icon name="info" size={16} class="note-box-icon" /><span
        >Arazzo documents outside the supported subset are refused (e.g. goto actions, jsonpath criteria, workflowId steps). Success criteria use the simple
        and regex types; step actions are end and retry.</span
      ></div
    ></div
  >{/snippet}

{#snippet agentBody(agent: AgentPreview)}{#snippet badge()}<ApiBadge protocol="A2A" name="Pastry concierge" version="1.0" />{/snippet}{#snippet extra()}<ProjectionPill
    />{/snippet}{@render artifactCard({
    icon: 'id-card',
    name: agent.fileName,
    origin: preview.origin,
    status: agentStatus(agent),
    format: preview.formatLabel,
    badge,
    extra,
  })}<div class="step-section"
    ><h3>{agent.skills.length}<!----> skills discovered · each one becomes an operation</h3><ul class="boxed-list"
      >{#each agent.skills as k (k.id)}<li
          ><span class="boxed-list-main" style="flex-basis: 200px"
            ><span class="boxed-list-title">{k.name}</span><span class="boxed-list-sub"
              >skill id: <!---->{k.id}<!---->{k.modes ? ` · ${k.modes}` : ''}</span
            ></span
          ><span class="boxed-list-op"><Icon name="arrow-right" size={13} />operation <!---->{k.id}</span>{#if k.note}<Chip variant="outline">{k.note}</Chip
            >{/if}</li
        >{/each}</ul
    ></div
  ><div class="agent-split"
    ><div class="step-section"
      ><h3>{agent.interfaces.length}<!----> interfaces · supportedInterfaces, in order</h3><ol class="boxed-list" data-dense=""
        >{#each agent.interfaces as i, n (i.binding)}<li
            ><span class="boxed-list-binding">{i.binding}</span><span class="boxed-list-url">{i.url}</span>{#if i.preferred}<Chip
                size="sm"
                variant="outline"
                tone="info">preferred</Chip
              >{/if}<span class="sr-only">{`Mock: ${agent.mockInterfaces[n]?.url ?? ''}`}</span></li
          >{/each}</ol
      ></div
    ><div class="step-section"
      ><h3>Capabilities</h3><ul class="capabilities"
        >{#each agent.capabilities as c (c.name)}<li data-on={String(c.on)}
            ><Icon name={c.on ? 'check' : 'close-sm'} size={13} />{c.name}<span class="sr-only">{c.on ? ' (supported)' : ' (not supported)'}</span></li
          >{/each}<li>Modes <!---->{agent.modes.join(', ')}</li></ul
      ></div
    ></div
  ><div role="note" class="note-box" data-tone="warning"
    ><Icon name="alert-circle" size={16} class="note-box-icon" /><span
      >Add an APIExamples secondary artifact to give the mock its conversations. The card alone describes skills, not what the agent answers. The mock serves
      the card with supportedInterfaces rewritten to point at Microcks, on all <!---->{agent.mockInterfaces.length}<!----> transports.</span
    ></div
  >{/snippet}

{#snippet secretLabel()}Authentication Secret <span class="field-hint">optional, for a protected URL</span>{/snippet}

<div class="step-card"
  ><div class="step-head"
    ><span class="step-head-badge"><Icon name="eye" size={18} /></span><div class="step-head-text"
      ><h2>Preview before creating the source</h2><p>Nothing has been created yet. Here is what Microcks detected in the artifact.</p></div
    ></div
  >{#if preview.arazzo}{@render arazzoBody(preview.arazzo)}{:else if preview.agent}{@render agentBody(preview.agent)}{:else}{#each preview.services as s (`${s.name}${s.version}`)}{#snippet badge()}<ApiBadge
          protocol={s.protocol}
          name={s.name}
          version={s.version}
        />{/snippet}<div class="step-section" style="gap: 20px"
        >{@render artifactCard({ icon: 'document', name: preview.artifactName ?? '', origin: preview.origin, format: preview.formatLabel, badge })}<div
          class="step-section"
          ><h3>{pluralize(s.operations.length, 'Operation')}<!----> discovered · <!---->{preview.exampleCount ?? 0}<!----> Examples</h3><ul class="boxed-list"
            >{#each s.operations as o (`${o.method}${o.path}`)}<li
                ><MethodTag method={o.method} protocol={s.protocol} /><span class="boxed-list-path">{o.path}</span><span class="boxed-list-meta"
                  >{o.dispatcher}</span
                ><span class="boxed-list-end" data-wide="">{pluralize(o.exampleCount ?? 0, 'Example')}</span></li
              >{/each}</ul
          ></div
        ></div
      >{/each}<div class="step-section"
      ><h3 id="role-title">Artifact role</h3><Segmented
        class="role-toggle"
        label="Artifact role"
        variant="joined"
        tone="primary"
        value={role}
        onchange={(id) => onrolechange(id as 'primary' | 'secondary')}
        options={[
          { id: 'primary', label: 'Primary' },
          { id: 'secondary', label: 'Secondary' },
        ]}
      /><p style="max-width: 720px"
        >{role === 'secondary'
          ? 'Secondary: merges only non-conflicting Examples into an existing API, matched by name + version (here API Pastry 2.0). Ignored if no API matches.'
          : 'Primary: brings the Service structure, its Operations and its Examples. This is the default; then add secondary Artifacts (Postman, HAR, APIExamples) to enrich the Examples.'}</p
      ></div
    >{#if preview.source.kind === 'url'}<div style="max-width: 360px"
        ><Field label={secretLabel}
          >{#snippet children(c)}<Select {...c} value={secret} onchange={(e) => onsecretchange(e.currentTarget.value)}
              ><option value="">None</option>{#each secretNames as s (s.id)}<option value={s.name}>{s.name}</option>{/each}</Select
            >{/snippet}</Field
        ></div
      >{/if}{#if preview.source.kind === 'git'}<div class="note-box"
        ><Icon name="clock" size={16} class="note-box-icon" /><span
          >The source “<!---->{preview.source.name}<!---->” will be created, scanned and imported immediately, then re-scanned every hour. <RouterLink
            to="/sources">Manage sources</RouterLink
          ></span
        ></div
      >{/if}{/if}<div class="step-actions"
    ><Button variant="primary" icon="download" loading={importing} onclick={onimport}>{importLabel(preview)}</Button><Button variant="secondary" onclick={oncancel}
      >Cancel</Button
    ></div
  ></div
>
