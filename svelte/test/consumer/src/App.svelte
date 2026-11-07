<script lang="ts">
  import { Button, ButtonLink, MethodTag, StatusBadge, LiveIndicator, SummaryStrip, SummaryStripSep, PROTOCOL_ATTR, Kbd, Input, Checkbox, RadioGroup, DataTable, Tabs, TabPanel, Dialog } from '@microcks/deep-ink';
  import type { ButtonProps, ButtonLinkProps, IconName, SummaryStripPart, Outcome, Protocol, MethodTagProps } from '@microcks/deep-ink';
  import '@microcks/deep-ink/styles.no-fonts.css';
  const protocol: Protocol = 'REST';
  const status: Outcome = 'conformant';
  const tag: MethodTagProps = { method: 'GET', protocol, class: ['consumer', { active: true }] };
  const parts: SummaryStripPart[] = [{ text: 'Packed', kind: 'label' }, { text: '3 APIs', sep: true }];
  let clicks = $state(0);
  let buttonElement = $state<HTMLButtonElement>();
  let linkElement = $state<HTMLAnchorElement>();
  const icon: IconName = 'never-tested';
  const button: ButtonProps = { variant: 'outline', tone: 'link', size: 'xs', icon, class: { packed: true } };
  const link: ButtonLinkProps = { href: '#details', icon: 'external', target: '_self' };
  let selection = $state('rest');
  let fieldValue = $state('Native');
</script>

<main>
  <h1>Standalone packed Svelte consumer</h1>
  <Button {...button} bind:element={buttonElement} onclick={() => clicks++}>Packed <strong>button</strong></Button>
  <ButtonLink {...link} bind:element={linkElement}>Packed link</ButtonLink>
  <ButtonLink href="/never" loading>Unavailable link</ButtonLink>
  <MethodTag {...tag} minWidth={52} onclick={() => clicks++} title={PROTOCOL_ATTR[protocol]} />
  <StatusBadge {status}>{' · verified '}<strong>natively</strong></StatusBadge>
  <LiveIndicator size="compact" pulse={false} />
  <LiveIndicator variant="dot" paused pausedLabel="paused · 2 new calls" />
  <SummaryStrip {parts} gap="roomy" values="text" lineHeight="inherit" variant="canvas" role="note" aria-label="Package smoke">
    <SummaryStripSep /><a href="#details">Details</a>
  </SummaryStrip>
  <p id="details">Clicks: {clicks}</p>
  <Kbd class="packed-shortcut">Enter</Kbd>
  <Input aria-label="Packed input" bind:value={fieldValue} oninput={() => clicks++} />
  <Checkbox label="Packed checkbox" />
  <RadioGroup legend="Packed protocols" options={[{ value: 'rest', label: 'REST' }]} bind:value={selection} />
  <DataTable caption="Packed rows" columns={[{ key: 'name', header: 'Name', rowHeader: true }]} rows={[{ name: 'Packed row' }]} rowKey={(row) => row.name} />
  <Tabs label="Packed tabs" items={[{ id: 'rest', label: 'REST' }]} bind:value={selection}>
    <TabPanel id="rest" value={selection}>Packed panel</TabPanel>
  </Tabs>
  <Dialog open={false} onclose={() => {}} title="Packed dialog" />
</main>
