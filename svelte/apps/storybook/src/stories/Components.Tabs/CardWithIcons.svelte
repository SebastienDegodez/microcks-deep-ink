<script lang="ts">
  import { TabPanel, Tabs } from '@microcks/deep-ink';
  const SOURCE_TABS = [
  { id: 'file', label: 'Upload', hint: 'one-off file', icon: 'document' as const },
  { id: 'url', label: 'URL', hint: 'fetched on demand', icon: 'link' as const },
  { id: 'git', label: 'Git repository', hint: 'kept in sync', icon: 'git-branch' as const },
  { id: 'direct', label: 'Direct API', hint: 'no contract', icon: 'zap' as const },
];
  let v = $state('file');
</script>

<div style="border:1px solid var(--border);border-radius:8px;background:var(--canvas)"><Tabs label="Source type" variant="card" items={SOURCE_TABS} value={v} onchange={(value) => (v = value)}>{#each SOURCE_TABS as t}<TabPanel id={t.id} value={v}><p style="margin:0;padding:0 20px 20px">Content of the {t.label} tab.</p></TabPanel>{/each}</Tabs></div>
