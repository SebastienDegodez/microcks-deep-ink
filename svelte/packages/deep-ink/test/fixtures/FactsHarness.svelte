<!-- Test-only: Facts with an extra FactRow holding a link, then a columns Facts, as the React spec. -->
<script lang="ts">
  import FactRow from '../../src/lib/facts/FactRow.svelte';
  import Facts from '../../src/lib/facts/Facts.svelte';
</script>

<div>
  <Facts
    termWidth="150px"
    items={[
      { term: 'Origin', value: 'GitLab repository' },
      { term: 'Artifact', value: 'Primary · OPEN_API_SPEC', sub: 'Creates or updates Services', mono: true },
    ]}
  >
    <FactRow term="Statistics"><a href="#/usage">Usage details</a></FactRow>
  </Facts>
  <Facts layout="columns" columns={3} strong items={[{ term: 'Duration', value: '1.84 s', mono: true }, { term: 'Result', value: 'Failed', tone: 'danger' }]} />
</div>
