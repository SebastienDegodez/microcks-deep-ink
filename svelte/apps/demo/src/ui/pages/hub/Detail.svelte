<script lang="ts">
  import {
    previewInstall, versionOf, type ArtifactRole, type CreatedLine, type HubPackage, type InstallMode, type InstallStatus, type PreviewRow,
  } from '@microcks/demo-core/domain/govern';
  import { ApiBadge, Button, Callout, Icon, LiveIndicator, Panel, RadioGroup, SectionLabel } from '@microcks/deep-ink';
  import { ButtonRouterLink } from '@/ui/app';
  import { plural } from '@/ui/app/format';
  import { MODE_OPTIONS, ROLE_OPTIONS, SIGN_TONE, conformanceStatus, conformanceValue, metaOf, tagKey } from './packages';

  type Props = {
    pkg: HubPackage;
    status: InstallStatus;
    installedMode: InstallMode;
    error: string;
    oninstall: (mode: InstallMode, role: ArtifactRole, picked: Record<string, string>) => void;
  };

  /** The selected package: its APIs and versions, the install choices, what the install creates, and its actions. */
  let { pkg, status, installedMode, error, oninstall }: Props = $props();
  let picked = $state.raw<Record<string, string>>({});
  let mode = $state<InstallMode>('sync');
  let role = $state<ArtifactRole>('main');
  const apis = $derived(pkg.apis ?? []);
  const effectiveMode = $derived(status ? installedMode : mode);
  const effectiveRole = $derived(status ? 'main' : role);
  const preview = $derived(previewInstall(pkg, picked, effectiveMode, effectiveRole, status));
</script>

{#snippet modeLegend()}<SectionLabel>How to install</SectionLabel>{/snippet}

{#snippet roleLegend()}<SectionLabel>Artifact role</SectionLabel>{/snippet}

{#snippet previewBadges(row: PreviewRow)}<li class="hb-preview-row" data-skipped={row.tag === 'SKIPPED' ? '' : undefined}
    ><span class="hb-tag" data-tag={tagKey(row.tag)}>{row.tag}</span><ApiBadge
      size="compact"
      protocol={row.protocol}
      name={row.name}
      version={row.version}
    /><ApiBadge size="compact" label="samples" value={String(row.samples)} status="action" /><ApiBadge
      size="compact"
      label="conformance"
      value={conformanceValue(row)}
      status={conformanceStatus(row)}
    />{#if row.mcp}<ApiBadge size="compact" label="mcp" value="agent-ready" status="info" />{/if}</li
  >{/snippet}

{#snippet createdItem(line: CreatedLine)}<li
    ><span class="hb-sign" data-tone={SIGN_TONE[line.sign]} aria-hidden="true">{line.sign}</span><span class="hb-created-text"
      ><span>{line.text}</span>{#if line.sub}<span class="hb-created-sub">{line.sub}</span>{/if}</span
    ></li
  >{/snippet}

<Panel as="section" padding="lg" class="hb-detail" aria-label="Package detail" aria-busy={status === 'installing'}
  ><div class="hb-detail-head"
    ><div class="hb-detail-title"><h2>{pkg.name}</h2><span class="tile-tag">{pkg.category}</span></div
    ><p class="hb-detail-desc">{pkg.description}</p><span class="hb-detail-meta"
      >maintained by community · <!---->{metaOf(pkg)}<!----> · <span class="demo-mono">hub.microcks.io/package/<!---->{pkg.id}</span></span
    ></div
  ><div class="hb-block"
    ><SectionLabel as="h3">{plural(apis.length, 'API in this package', 'APIs in this package')}</SectionLabel
    >{#each apis as a (a.name)}{@const v = versionOf(a, picked)}<div class="hb-api"
        ><div class="hb-api-head"
          ><ApiBadge size="compact" protocol={a.protocol} name={a.name} /><div role="group" aria-label={`Version of ${a.name}`} class="hb-versions"
            >{#each a.versions as x (x)}<button type="button" aria-pressed={x === v} onclick={() => (picked = { ...picked, [a.name]: x })}>{x}</button>{/each}</div
          ></div
        ><div class="hb-api-facts"
          ><span>{plural(a.operations[v] ?? 0, 'operation')}<!----> · <!---->{a.examples[v] ?? 0}<!----> examples</span><span class="demo-mono"
            >{a.contracts}</span
          >{#if a.inCatalogue.includes(v)}<span class="hb-exists"><Icon name="check" size={12} stroke-width={2.6} />already in your catalogue</span>{/if}</div
        ></div
      >{/each}</div
  >{#if status === ''}<div class="hb-options"
      ><RadioGroup
        variant="card"
        class="hb-fieldset"
        legend={modeLegend}
        name="hub-mode"
        value={mode}
        onchange={(v) => (mode = v as InstallMode)}
        options={MODE_OPTIONS}
      /><RadioGroup
        variant="card"
        class="hb-fieldset"
        legend={roleLegend}
        name="hub-role"
        value={role}
        onchange={(v) => (role = v as ArtifactRole)}
        options={ROLE_OPTIONS}
      /></div
    >{/if}<section class="hb-block" aria-labelledby={`hb-preview-${pkg.id}`}
    ><div class="hb-preview-head"><h3 id={`hb-preview-${pkg.id}`}>{preview.title}</h3><span>{preview.subtitle}</span></div
    ><ul class="hb-preview">{#each preview.rows as r (r.name)}{@render previewBadges(r)}{/each}</ul></section
  ><div class="hb-block"
    ><SectionLabel as="h3">{preview.heading}</SectionLabel><ul class="hb-created">{#each preview.created as l, i (i)}{@render createdItem(l)}{/each}</ul
    >{#if preview.blocked && status === ''}<Callout tone="warning" variant="outline"><p>{preview.blocked}</p></Callout>{/if}</div
  >{#if error}<Callout tone="danger" title="Install failed" live="assertive"><p>{error}</p></Callout>{/if}<div class="hb-actions"
    >{#if status === ''}<Button variant="primary" size="lg" icon="download" disabled={Boolean(preview.blocked)} onclick={() => oninstall(mode, role, picked)}
        >{preview.installLabel}</Button
      ><span class="hb-hint">Nothing is written before you click.</span>{/if}{#if status === 'installing'}<LiveIndicator
        id="hb-detail-live"
        tabindex={-1}
        variant="box"
        size="lg"
        label="live · fetching and importing artifacts"
      />{/if}{#if status === 'installed'}<span class="hb-installed"><Icon name="check" size={15} stroke-width={2.4} />Installed</span><ButtonRouterLink
        variant="primary"
        id="hb-detail-view"
        to="/services">View in catalogue<Icon name="arrow-right" size={14} /></ButtonRouterLink
      >{#if installedMode === 'sync'}<ButtonRouterLink to="/sources">See importers in Sources</ButtonRouterLink>{/if}{/if}</div
  ></Panel
>
