<script lang="ts">
  import {
    ApiBadge,
    Button,
    ButtonLink,
    Callout,
    DataTable,
    DropZone,
    Field,
    Input,
    Panel,
    Tabs,
    TabPanel,
  } from '@microcks/deep-ink';
  import { demo } from '../model.svelte';
  import { navigate } from '../data';
  let { path }: { path: string } = $props();
  let tab = $state('upload');
  let name = $state('');
  let url = $state('');
  let preview = $state(false);
  let notice = $state('');
  let error = $state('');
  function prepare() {
    error = '';
    if (tab === 'upload' && !name) {
      error = 'Choose a file or use the sample contract.';
      return;
    }
    if (tab === 'direct' && !name.trim()) {
      error = 'Enter a service name.';
      return;
    }
    if (tab === 'url' || tab === 'git') {
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol))
          throw new Error('Use HTTP or HTTPS');
      } catch {
        error = 'Enter a valid HTTP or HTTPS URL.';
        return;
      }
    }
    preview = true;
  }
  function save() {
    demo.sources.unshift({
      id: `source-${demo.sources.length + 1}`,
      name: name || url,
      type: tab,
      status: 'Imported',
      services: tab === 'direct' ? name : 'API Pastry 2.0',
      at: 'just now',
    });
    if (tab === 'direct')
      demo.services.push({
        id: `direct-${demo.services.length + 1}`,
        name,
        version: '1.0',
        protocol: 'DIRECT',
        operations: 4,
        calls: 0,
        score: null,
        domain: 'demo',
        format: 'Direct API',
      });
    navigate('/sources');
  }
</script>

<div class="demo-page">
  <header class="demo-page-header">
    <div>
      <h1 tabindex="-1">
        {path === '/sources/new' ? 'Add a source' : 'Sources'}
      </h1>
      <p class="demo-muted">
        Every contract comes from a source. Import once or keep it synchronized.
      </p>
    </div>
    <ButtonLink href="#/sources/new" variant="primary" icon="plus"
      >Add a source</ButtonLink
    >
  </header>
  {#if path !== '/sources/new'}
    {#if notice}<p role="status">{notice}</p>{/if}
    {#snippet sync(row: (typeof demo.sources)[number])}<Button
        size="sm"
        icon="refresh"
        onclick={() => {
          row.status = 'Synced';
          row.at = 'just now';
          notice = `${row.name} synchronized (simulated).`;
        }}>Sync now</Button
      >{/snippet}
    <DataTable
      caption="Imported sources"
      rowKey="id"
      columns={[
        { key: 'name', header: 'Source' },
        { key: 'type', header: 'Type' },
        { key: 'services', header: 'Produces' },
        { key: 'status', header: 'Status' },
        { key: 'at', header: 'Last sync' },
        { key: 'sync', header: 'Action', render: sync },
      ]}
      rows={demo.sources}
    />
    <Panel title="Sync timeline"
      ><p>pastry-openapi.yaml · 2 h ago · 1 service updated</p>
      <p>pastry-arazzo.yaml · 3 h ago · beerCatalog needs linking</p>
      <ButtonLink href="#/workflows">Resolve workflow sources</ButtonLink
      ></Panel
    >
  {:else}
    <Callout title="Simulated import"
      >This clickable prototype does not upload files or fetch remote sources.
      The preview uses the sample Pastry contract.</Callout
    >
    {#if preview}
      <Panel title="Review before importing"
        ><ApiBadge
          protocol="REST"
          name={tab === 'direct' ? name : 'API Pastry'}
          version="2.0"
        />
        <p>4 operations · 7 examples · OpenAPI 3.0</p>
        <p class="demo-code">{name || url}</p>
        <div class="demo-actions">
          <Button onclick={() => (preview = false)}>Back</Button><Button
            variant="primary"
            icon="download"
            onclick={save}>Import source</Button
          >
        </div></Panel
      >
    {:else}
      <Tabs
        label="Source type"
        bind:value={tab}
        items={[
          { id: 'upload', label: 'Upload', icon: 'upload' },
          { id: 'url', label: 'URL', icon: 'link' },
          { id: 'git', label: 'Git repository' },
          { id: 'direct', label: 'Direct API', icon: 'plus' },
        ]}
      >
        <TabPanel id="upload" value={tab}
          ><div class="demo-tab-content">
            <DropZone
              heading="Drop your API contract here"
              hint="OpenAPI, AsyncAPI, Protobuf, GraphQL, Postman or SoapUI"
              onfiles={(files) => {
                name = files[0].name;
                error = '';
              }}
              multiple={false}
            /><Button
              variant="secondary"
              onclick={() => (name = 'pastry-openapi.yaml')}
              >Use sample contract</Button
            >{#if name}<p role="status">Selected: {name}</p>{/if}
          </div></TabPanel
        >
        <TabPanel id="url" value={tab}
          ><div class="demo-tab-content">
            <Field label="Contract URL" required
              >{#snippet children(p)}<Input
                  {...p}
                  type="url"
                  bind:value={url}
                  placeholder="https://example.test/pastry-openapi.yaml"
                />{/snippet}</Field
            >
          </div></TabPanel
        >
        <TabPanel id="git" value={tab}
          ><div class="demo-tab-content demo-form">
            <Field label="Repository URL" required
              >{#snippet children(p)}<Input
                  {...p}
                  bind:value={url}
                  placeholder="https://github.com/example/contracts"
                />{/snippet}</Field
            ><Field label="Branch"
              >{#snippet children(p)}<Input
                  {...p}
                  value="main"
                />{/snippet}</Field
            ><Field label="Contract path"
              >{#snippet children(p)}<Input
                  {...p}
                  bind:value={name}
                  placeholder="contracts/pastry.yaml"
                />{/snippet}</Field
            >
          </div></TabPanel
        >
        <TabPanel id="direct" value={tab}
          ><div class="demo-tab-content">
            <Field label="Service name" required
              >{#snippet children(p)}<Input
                  {...p}
                  bind:value={name}
                />{/snippet}</Field
            >
          </div></TabPanel
        >
      </Tabs>
      {#if error}<p role="alert">{error}</p>{/if}
      <div class="demo-actions">
        <ButtonLink href="#/sources">Cancel</ButtonLink><Button
          variant="primary"
          onclick={prepare}>Preview import</Button
        >
      </div>
    {/if}
  {/if}
</div>
