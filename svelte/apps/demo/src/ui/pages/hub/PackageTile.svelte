<script lang="ts">
  import { packageTotals, type HubPackage, type InstallStatus } from '@microcks/demo-core/domain/govern';
  import { ApiBadge, Button, Icon, LiveIndicator, Tile } from '@microcks/deep-ink';
  import { ButtonRouterLink } from '@/ui/app';
  import { metaOf } from './packages';

  type Props = {
    pkg: HubPackage;
    selected: boolean;
    status: InstallStatus;
    onselect: () => void;
    oninstall: () => void;
  };

  /** A package of the Hub grid: its APIs, its totals and its install action. */
  let { pkg, selected, status, onselect, oninstall }: Props = $props();
  const totals = $derived(packageTotals(pkg, {}));
</script>

{#snippet meta()}maintained by <b>community</b> · <!---->{metaOf(pkg)}{/snippet}

{#snippet aside()}<span class="tile-tag">{pkg.category}</span>{/snippet}

{#snippet footer()}{#if status === ''}<Button variant="primary" size="tile" icon="download" onclick={oninstall}>Install</Button>{/if}{#if status === 'installing'}<LiveIndicator
      id={`hb-card-${pkg.id}-live`}
      tabindex={-1}
      variant="box"
      label={`live · installing ${pkg.apiCount} APIs`}
    />{/if}{#if status === 'installed'}<span class="hb-installed"><Icon name="check" size={15} stroke-width={2.4} />Installed</span><ButtonRouterLink
      size="tile"
      id={`hb-card-${pkg.id}-view`}
      to="/services">View in catalogue<Icon name="arrow-right" size={13} /></ButtonRouterLink
    >{/if}<span class="tile-footer-end">{totals.operations}<!----> ops · <!---->{totals.examples}<!----> examples</span>{/snippet}

<Tile title={pkg.name} headingLevel={2} {selected} {onselect} {meta} {aside} {footer}
  ><p>{pkg.description}</p><div class="tile-badges"
    >{#each pkg.apis ?? [] as a (a.name)}<ApiBadge size="sm" protocol={a.protocol} name={a.name} version={a.versions[0]} />{/each}</div
  ></Tile
>
