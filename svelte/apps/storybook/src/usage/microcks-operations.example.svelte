<script lang="ts">
  import { OperationList, OperationRow } from '@microcks/deep-ink';
  const OPERATIONS = [
    { method: 'GET', path: '/pastries', meta: '3 examples' },
    { method: 'GET', path: '/pastries/{name}', meta: '3 examples · URI_PARTS' },
    { method: 'PATCH', path: '/pastries/{name}', meta: '1 example · URI_PARTS' },
  ];
  let selected = $state('GET /pastries');
</script>
<OperationList label="Operations of API Pastry 2.0" style="max-width:640px">
  {#each OPERATIONS as { method, path, meta } (`${method} ${path}`)}
    <OperationRow {method} {path} {meta} selected={selected === `${method} ${path}`} mockUrl={`http://localhost:8080/rest/API+Pastry/2.0${path}`} onselect={() => { selected = `${method} ${path}`; }} />
  {/each}
</OperationList>
