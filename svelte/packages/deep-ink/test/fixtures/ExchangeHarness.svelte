<!-- Test-only: the React spec's Exchange of a request card and a response card, under a page heading. -->
<script lang="ts">
  import Exchange from '../../src/lib/exchange-card/Exchange.svelte';
  import ExchangeCard from '../../src/lib/exchange-card/ExchangeCard.svelte';
</script>

{#snippet request()}<ExchangeCard
    title="Request"
    label="Request of Eclair Cafe"
    meta="Eclair Cafe"
    blocks={[
      { label: 'Request line', text: 'GET /pastries/Eclair%20Cafe', tone: 'secondary' },
      { label: 'Parameters', text: 'name = Eclair Cafe', tone: 'params' },
    ]}
  />{/snippet}
{#snippet response()}<ExchangeCard
    title="Response"
    label="Response of Eclair Cafe"
    status="404 Not Found"
    statusTone="warning"
    blocks={[{ label: 'Response body', text: '{}', grow: true }]}
  />{/snippet}

<main>
  <h3>Eclair Cafe</h3>
  <Exchange children={[request, response]} />
</main>
