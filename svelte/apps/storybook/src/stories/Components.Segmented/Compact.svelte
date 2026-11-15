<script lang="ts">
  import { Segmented } from '@microcks/deep-ink';
  let lang = $state('groovy');
  let period = $state('today');
</script>

<div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start"><Segmented label="Script language" variant="joined" size="sm" value={lang} onchange={(value) => (lang = value)} options={[{ id: 'groovy', label: 'Groovy' }, { id: 'js', label: 'JavaScript' }]} /><Segmented label="Period" spacing="wide" value={period} onchange={(value) => (period = value)} options={[{ id: 'today', label: 'Today' }, { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }]} /></div>
