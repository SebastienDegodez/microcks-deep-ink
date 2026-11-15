<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
</script>

<div style="max-width:360px"><CodeBlock caption="contract-tests.yml" tabs={[{ id: 'gh', label: 'GitHub Actions' }, { id: 'gl', label: 'GitLab CI' }, { id: 'cli', label: 'CLI' }]} tab="gh" ontabchange={() => {}} lines={[
          { text: 'jobs:' },
          { text: '  contract-test:' },
          { text: '    steps:' },
          { text: '      - name: Contract test API Pastry 2.0', changed: true },
          { text: '        uses: microcks/test-github-action@v1', changed: true },
          { text: '        with:' },
          { text: "          runner: 'OPEN_API_SCHEMA'", changed: true },
        ]} /></div>
