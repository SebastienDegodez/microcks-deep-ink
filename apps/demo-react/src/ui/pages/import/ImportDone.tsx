import { Link as RouterLink } from 'react-router';
import type { ImportResult } from '@/domain/importing';
import { ApiBadge, Button, CopyButton, Icon, ProjectionPill } from '@microcks/deep-ink';
import { doneSub, isTestable, openTarget } from './result';

interface ImportDoneProps {
  result: ImportResult;
  onReset: () => void;
  /** Minutes until the next global scan, for the Git source sentence. */
  nextScanMinutes: number;
}

/** Step 3: the source is created and its mock is live. */
export function ImportDone({ result, onReset, nextScanMinutes }: ImportDoneProps) {
  const open = openTarget(result);
  const testable = isTestable(result);
  return (
    <div className="step-card" data-step="done">
      <div role="status" className="step-head">
        <Icon name="check-circle" size={32} className="step-done-icon" />
        <div className="step-head-text">
          <h2>{result.outcome === 'direct' ? 'Mock created and live' : 'Source created'}</h2>
          <p>{doneSub(result, nextScanMinutes)}</p>
        </div>
      </div>

      {result.createdSource ? (
        <div className="created-source">
          <Icon name="database" size={16} className="created-source-icon" />
          <span className="created-source-text">
            <span className="created-source-name">{result.createdSource.name}</span>
            <span className="created-source-detail">{result.createdSource.detail}</span>
          </span>
          <span className="created-source-origin">{result.createdSource.origin}</span>
          <span className="created-source-schedule">{result.createdSource.schedule}</span>
          <RouterLink to="/sources">View in Sources</RouterLink>
        </div>
      ) : null}

      {result.outcome === 'arazzo' && result.arazzo ? (
        <div className="done-badges">
          <ApiBadge arazzo name={`${result.name} ${result.version}`} />
          <ApiBadge label="workflows" value={String(result.arazzo.workflows)} status="success" />
          <ApiBadge label="steps" value={String(result.arazzo.steps)} />
        </div>
      ) : result.outcome === 'a2a' && result.agent ? (
        <>
          <div className="done-badges">
            <ApiBadge protocol="A2A" name={result.name} version={result.version} />
            <ApiBadge label="skills" value={String(result.agent.skills)} status="success" />
            <ApiBadge label="conversations" value={`${result.agent.conversations} · add APIExamples`} status="warning" />
            <ProjectionPill />
          </div>
          <div className="done-field">
            <span id="mock-endpoints-label" className="done-label">Mock endpoints · the {result.endpoints?.length ?? 0} transports are served at once</span>
            <ul className="boxed-list endpoints" aria-labelledby="mock-endpoints-label">
              {(result.endpoints ?? []).map((e) => (
                <li key={e.binding}>
                  <span className="boxed-list-binding">{e.binding}</span>
                  <span className="boxed-list-url">{e.url}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="done-badges">
            {result.protocol && result.protocol !== 'ARAZZO' ? <ApiBadge protocol={result.protocol} name={result.name} version={result.version} /> : null}
            {result.mcp ? <ApiBadge label="mcp" value="agent-ready" status="info" /> : null}
            <ApiBadge label="samples" value={result.samples ?? '0'} status="warning" />
          </div>
          <div className="done-field">
            <span id="mock-url-label" className="done-label">{result.mockLabel}</span>
            <div className="mock-url-field" role="group" aria-labelledby="mock-url-label">
              <code>{result.mockUrl}</code>
              <CopyButton value={result.mockUrl ?? ''} label="Copy" />
            </div>
          </div>
          {result.tryIt ? (
            <div className="done-field">
              <span id="try-it-label" className="done-label">Try it now</span>
              <pre className="try-it" aria-labelledby="try-it-label">{result.tryIt}</pre>
            </div>
          ) : null}
        </>
      )}

      <div className="step-actions">
        <Button asChild variant="primary"><RouterLink to={open.to}>{open.label}<Icon name="arrow-right" size={16} /></RouterLink></Button>
        <Button asChild variant="secondary"><RouterLink to="/sources">Back to Sources</RouterLink></Button>
        <Button variant="ghost" onClick={onReset}>Add another source</Button>
        {testable ? <Button asChild variant="secondary" icon="play"><RouterLink to={`/tests/create?service=${result.serviceId}`}>Run a test</RouterLink></Button> : null}
      </div>
    </div>
  );
}
