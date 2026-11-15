import type { AgentPreview, ArazzoPreview, ImportPreview, ImportResult } from '../../domain/importing/index.js';

/** Label of the import button: the workflows of an Arazzo document, "Create source" for a source Microcks keeps, else "Import". */
export const importLabel = ({ arazzo, agent, source }: ImportPreview) =>
  arazzo ? `Import ${arazzo.workflows.length} workflows` : agent || source.kind === 'git' || source.kind === 'url' ? 'Create source' : 'Import';

/** What Microcks understood of an Arazzo document, in one sentence. */
export const arazzoStatus = (arazzo: ArazzoPreview) =>
  `Valid Arazzo ${arazzo.arazzoVersion} · title “${arazzo.title}” ${arazzo.version} · ${arazzo.workflows.length} workflows · ${arazzo.sources.length} source descriptions`;

/** Steps of all the workflows of an Arazzo document. */
export const workflowSteps = (arazzo: ArazzoPreview) => arazzo.workflows.reduce((n, w) => n + w.steps, 0);

/** File name of the overlay that links the source descriptions: `pastry-workflows.arazzo-sources.yaml`. */
export const overlayFileName = (arazzo: ArazzoPreview) => arazzo.fileName.replace(/\.arazzo\.ya?ml$/, '.arazzo-sources.yaml');

/** What Microcks understood of an A2A Agent Card, in one sentence. */
export const agentStatus = (agent: AgentPreview) =>
  `Valid A2A Agent Card · provider ${agent.provider} · ${agent.skills.length} skills · ${agent.interfaces.length} interfaces · security ${agent.security}`;

/** Where the done screen leads: the workflows of an Arazzo document, else the agent or the service it created. */
export const openTarget = (result: ImportResult) =>
  result.outcome === 'arazzo'
    ? { to: '/workflows', label: 'Open workflows' }
    : result.outcome === 'a2a'
      ? { to: `/services/${result.serviceId}`, label: 'Open agent' }
      : { to: `/services/${result.serviceId}`, label: 'Open service' };

/** Arazzo workflows and A2A agents are not tested from the done screen. */
export const isTestable = (result: ImportResult) => result.outcome !== 'arazzo' && result.outcome !== 'a2a';

/** The sentence under the title of the done screen, by outcome. */
export function doneSub(r: ImportResult, nextScanMinutes: number): string {
  const full = `${r.name} ${r.version}`;
  switch (r.outcome) {
    case 'importer-created': return `First scan of “${r.importerName ?? r.name}” done: ${r.operationCount} Operations, ${r.samples ?? 0} Examples served. Next re-scan in ${nextScanMinutes} min.`;
    case 'merged': return `Secondary artifact: non-conflicting Examples were added to ${full} (name + version key). The mock already serves them.`;
    case 'arazzo': return `${full} is imported: ${r.arazzo?.workflows} workflows, ${r.arazzo?.steps} steps, ${r.arazzo?.sources} source descriptions linked. Play them on the Microcks mocks or run them against your implementations; order-pastry cannot run yet (AsyncAPI steps).`;
    case 'a2a': return `${full} is imported as an A2A service: ${r.agent?.skills ?? 0} skills became operations and the mock serves the card on ${r.agent?.transports.length ?? 0} transports. It answers with a rejected task until conversations are added.`;
    case 'direct': return r.protocol === 'EVENT' ? `${full} publishes the reference payload of the “${r.resource}” resource at a regular interval.` : `${full} exposes the “${r.resource}” resource: create, read, filter and delete with free-form JSON.`;
    default: return `${full} is imported: ${r.operationCount} Operations, ${r.samples} Examples served by the mock.`;
  }
}
