<script lang="ts">
  import {
    ApiBadge,
    Button,
    Callout,
    DataTable,
    Dialog,
    Field,
    Input,
    Panel,
    Select,
    Tabs,
    TabPanel,
  } from '@microcks/deep-ink';
  import { demo } from '../model.svelte';
  let { path }: { path: string } = $props();
  const hub = $derived(path === '/hub');
  let tab = $state('users');
  let notice = $state('');
  let secretOpen = $state(false);
  let secretName = $state('');
  let credential = $state('');
  let secretKind = $state('Token');
  let error = $state('');
  let deleting = $state<string | undefined>();
  let group = $state('platform');
  function saveSecret() {
    error = '';
    if (!/^[a-zA-Z0-9_-]+$/.test(secretName)) {
      error =
        'Name may contain only letters, numbers, hyphens and underscores.';
      return;
    }
    if (!credential.trim()) {
      error = 'Enter a credential.';
      return;
    }
    if (demo.secrets.some((s) => s.name === secretName)) {
      error = 'A secret with this name already exists.';
      return;
    }
    demo.secrets.push({
      id: `secret-${demo.secrets.length + 1}`,
      name: secretName,
      kind: secretKind,
      summary: '••••••••',
    });
    credential = '';
    secretOpen = false;
    notice = `Secret ${secretName} created in memory.`;
  }
</script>

{#snippet userRole(row: (typeof demo.users)[number])}<Select
    aria-label={`Role of ${row.name}`}
    value={row.role}
    onchange={(e) => {
      row.role = e.currentTarget.value;
      notice = `${row.name} role saved in memory.`;
    }}
    ><option>admin</option><option>user</option><option>viewer</option></Select
  >{/snippet}
{#snippet removeSecret(row: (typeof demo.secrets)[number])}<Button
    variant="ghost"
    tone="danger"
    size="sm"
    onclick={() => (deleting = row.id)}>Delete</Button
  >{/snippet}
<div class="demo-page">
  <header class="demo-page-header">
    <div>
      <h1 tabindex="-1">{hub ? 'Hub' : 'Administration'}</h1>
      <p class="demo-muted">
        {hub
          ? 'Discover public API packages and install them in your mock catalogue.'
          : 'Share and administer this Microcks instance.'}
      </p>
    </div>
  </header>
  {#if notice}<p role="status">{notice}</p>{/if}
  {#if hub}
    <Callout title="Demo packages"
      >Installation is simulated. Nothing is downloaded or sent to a server.</Callout
    >
    <div class="demo-wall">
      {#each [{ id: 'pastry', name: 'API Pastry', version: '2.0', description: 'The canonical pastry REST sample', protocol: 'REST' as const }, { id: 'orders', name: 'Pastry orders API', version: '0.1.0', description: 'Event-driven pastry orders', protocol: 'EVENT' as const }, { id: 'concierge', name: 'Pastry concierge', version: '1.0', description: 'A2A agent card and conversations', protocol: 'A2A' as const }] as pkg}<Panel
          title={pkg.name}
          ><ApiBadge
            protocol={pkg.protocol}
            name={pkg.name}
            version={pkg.version}
          />
          <p class="demo-muted">{pkg.description}</p>
          <p>Microcks community · Apache-2.0</p>
          <Button
            variant="primary"
            disabled={demo.installed.includes(pkg.id)}
            onclick={() => {
              demo.installed.push(pkg.id);
              demo.sources.unshift({
                id: `hub-${pkg.id}`,
                name: pkg.name,
                type: 'Hub',
                status: 'Imported',
                services: pkg.name,
                at: 'just now',
              });
              notice = `${pkg.name} installed in memory. See Sources.`;
            }}
            >{demo.installed.includes(pkg.id)
              ? 'Installed'
              : 'Install package'}</Button
          ></Panel
        >{/each}
    </div>
  {:else}
    <Tabs
      label="Administration sections"
      bind:value={tab}
      items={[
        { id: 'users', label: 'Users', count: 2 },
        { id: 'groups', label: 'Groups' },
        { id: 'secrets', label: 'Secrets' },
        { id: 'snapshots', label: 'Snapshots' },
        { id: 'configuration', label: 'Configuration' },
      ]}
    >
      <TabPanel id="users" value={tab}
        ><div class="demo-tab-content">
          <DataTable
            caption="Instance users"
            rowKey="id"
            columns={[
              { key: 'name', header: 'User' },
              { key: 'email', header: 'Email' },
              { key: 'role', header: 'Role', render: userRole },
              { key: 'group', header: 'Group' },
            ]}
            rows={demo.users}
          />
        </div></TabPanel
      >
      <TabPanel id="groups" value={tab}
        ><div class="demo-tab-content">
          <Panel title="Roles × groups"
            ><Field label="Group"
              >{#snippet children(p)}<Select {...p} bind:value={group}
                  ><option>platform</option><option>pastry</option></Select
                >{/snippet}</Field
            ><DataTable
              caption={`${group} members`}
              rowKey="id"
              columns={[
                { key: 'name', header: 'User' },
                { key: 'role', header: 'Role' },
              ]}
              rows={demo.users.filter((u) => u.group === group)}
            /><Button
              onclick={() => {
                const user = demo.users.find((u) => u.group !== group);
                if (user) {
                  user.group = group;
                  notice = `${user.name} added to ${group}.`;
                } else notice = 'All users are already members of this group.';
              }}>Add available user</Button
            ></Panel
          >
        </div></TabPanel
      >
      <TabPanel id="secrets" value={tab}
        ><div class="demo-tab-content">
          <Callout title="Use dummy credentials only"
            >This is a prototype, not a secure credential store. Credential
            values are discarded after creation.</Callout
          ><Button
            icon="plus"
            variant="primary"
            onclick={() => {
              secretOpen = true;
              secretName = '';
              credential = '';
              error = '';
            }}>Create secret</Button
          ><DataTable
            caption="Secrets"
            rowKey="id"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'kind', header: 'Kind' },
              { key: 'summary', header: 'Credential' },
              { key: 'delete', header: 'Action', render: removeSecret },
            ]}
            rows={demo.secrets}
          />
        </div></TabPanel
      >
      <TabPanel id="snapshots" value={tab}
        ><div class="demo-tab-content">
          <Button
            onclick={() => {
              demo.snapshots.unshift({
                id: `snapshot-${demo.snapshots.length + 1}`,
                name: `Snapshot ${demo.snapshots.length + 1}`,
                at: 'just now',
                size: '9 services',
              });
              notice = 'Snapshot metadata created in memory (no backup file).';
            }}>Create snapshot</Button
          ><DataTable
            caption="Snapshot history"
            rowKey="id"
            columns={[
              { key: 'name', header: 'Snapshot' },
              { key: 'at', header: 'Created' },
              { key: 'size', header: 'Contents' },
            ]}
            rows={demo.snapshots}
          />
        </div></TabPanel
      >
      <TabPanel id="configuration" value={tab}
        ><div class="demo-tab-content">
          <Panel title="Instance configuration"
            ><div class="demo-form">
              <Field label="Instance name"
                >{#snippet children(p)}<Input
                    {...p}
                    bind:value={demo.configuration.name}
                  />{/snippet}</Field
              ><Field label="Public mock URL"
                >{#snippet children(p)}<Input
                    {...p}
                    bind:value={demo.configuration.url}
                  />{/snippet}</Field
              ><Button
                onclick={() =>
                  (notice = 'Configuration saved in memory (simulated).')}
                >Save configuration</Button
              >
            </div></Panel
          >
        </div></TabPanel
      >
    </Tabs>
  {/if}
</div>
<Dialog
  open={secretOpen}
  onclose={() => {
    secretOpen = false;
    credential = '';
  }}
  title="Create a demo secret"
  ><form
    class="demo-form"
    onsubmit={(e) => {
      e.preventDefault();
      saveSecret();
    }}
  >
    <Field label="Name" error={error || undefined} required
      >{#snippet children(p)}<Input
          {...p}
          bind:value={secretName}
        />{/snippet}</Field
    ><Field label="Kind"
      >{#snippet children(p)}<Select {...p} bind:value={secretKind}
          ><option>Token</option><option>Basic</option><option>OAuth2</option
          ></Select
        >{/snippet}</Field
    ><Field label="Dummy credential" required
      >{#snippet children(p)}<Input
          {...p}
          type="password"
          bind:value={credential}
          autocomplete="off"
        />{/snippet}</Field
    ><Button type="submit" variant="primary">Create secret</Button>
  </form></Dialog
>
<Dialog
  open={deleting !== undefined}
  onclose={() => (deleting = undefined)}
  title="Delete this secret?"
  description="Only the demo's in-memory secret metadata will be removed."
  ><Button
    variant="danger"
    confirm
    onclick={() => {
      demo.secrets = demo.secrets.filter((s) => s.id !== deleting);
      deleting = undefined;
      notice = 'Secret deleted from this session.';
    }}>Delete secret</Button
  ></Dialog
>
