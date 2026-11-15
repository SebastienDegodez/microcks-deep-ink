<script lang="ts">
 import { Button, ResultBox } from '@microcks/deep-ink';
 let { variant='Tones' }: { variant?: string } = $props(); let shown=$state(true);
</script>
{#if variant === 'Tones'}<div style="display:flex;flex-direction:column;gap:12px;max-width:720px"><div>{#if shown}<ResultBox size="md" ondismiss={()=>shown=false}>Secret gitlab-bakery created.</ResultBox>{:else}<Button size="sm" onclick={()=>shown=true}>Show the toast again</Button>{/if}</div><ResultBox action={linkAction}>Imported · 1 created, 2 replaced</ResultBox><ResultBox tone="neutral" title="checkout-beer cannot run until beerCatalog is linked" action={linkButton}>Beer Catalog API 1.0 is not in Microcks yet: import beer-catalog-1.0-openapi.yaml first, or pick the API to link in the dialog.</ResultBox><ResultBox tone="info" density="compact" action={undo}> <strong>Pastry orders events</strong> deleted. Services already discovered remain but are no longer updated.</ResultBox><ResultBox tone="danger">Export failed · the repository is read-only.</ResultBox></div>
{:else if variant === 'WarningDismissible'}<div style="max-width:560px">{#if shown}<ResultBox tone="warning" icon="spark" title="Partial result" live="off" ondismiss={()=>shown=false} dismissLabel="Dismiss the partial result">2 of 12 operations were skipped.</ResultBox>{:else}<Button onclick={()=>shown=true}>Show the result again</Button>{/if}</div>
{:else}<div style="max-width:720px"><ResultBox tone="danger" icon="cross" title="The agent answered a canceled task" bordered={false} surface="raised" live="off">tasks/cancel returned 200, then message/send on the same task id returned a new artifact. A canceled task must stay terminal.</ResultBox></div>{/if}
{#snippet linkAction()}<a href="#/services">Open the Catalogue</a>{/snippet}
{#snippet linkButton()}<Button size="sm" icon="link">Link source</Button>{/snippet}
{#snippet undo()}<Button variant="outline" size="xs" tone="link">Undo</Button>{/snippet}
