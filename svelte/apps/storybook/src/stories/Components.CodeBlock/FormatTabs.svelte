<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
  const SNIPPETS: Record<string, string> = {
      curl: "curl -X GET 'http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille'",
      httpie: 'http GET http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille',
    };
  let tab = $state('curl');
</script>

<CodeBlock code={SNIPPETS[tab]} language="shell" tabs={[{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }]} tab={tab} ontabchange={(value) => (tab = value)} />
