import { CI_FORMATS, CI_STEPS, ciDiffLegend, type CiFormat, type diffCiLines } from '@/domain/testing';
import { Chip, CodeBlock, Icon } from '@microcks/deep-ink';

interface CiAsideProps {
  uid: string;
  ciTab: CiFormat;
  onTabChange: (tab: CiFormat) => void;
  lines: ReturnType<typeof diffCiLines>;
  serviceLabel: string;
  oauth: boolean;
}

export function CiAside({ uid, ciTab, onTabChange, lines, serviceLabel, oauth }: CiAsideProps) {
  const changed = lines.filter((l) => l.changed).length;
  return (
    <aside className="tc-ci" aria-labelledby={`${uid}-ci-title`}>
      <div className="tc-ci-head">
        <h2 id={`${uid}-ci-title`} className="tc-ci-title">
          Run it from CI
        </h2>
        <Chip size="sm" variant="outline">
          <Icon name="refresh-arrows" size={12} /> synced with the form
        </Chip>
      </div>
      <p className="tc-ci-intro">The same test, as code. Once it passes here, paste it in your pipeline so every build proves the contract.</p>
      <CodeBlock
        className="tc-ci-code"
        tabsLabel="CI format"
        tabs={CI_FORMATS.map((f) => ({ id: f.id, label: f.label }))}
        tab={ciTab}
        onTabChange={(id) => onTabChange(id as CiFormat)}
        lines={lines.map((l) => ({ text: l.text || ' ', changed: l.changed }))}
      />
      <p className="tc-ci-legend" role="status">
        <span className="tc-ci-swatch" aria-hidden="true" />
        <span>{ciDiffLegend(changed, serviceLabel)}</span>
      </p>
      {oauth ? (
        <div className="tc-callout-outline" role="note">
          <Icon name="warning" size={14} />
          <span>OAuth2 settings only apply to this run from the UI: the CLI, the GitHub Action and the Tekton task shown here do not carry them.</span>
        </div>
      ) : null}
      <div className="tc-ci-steps">
        <h3>Before you paste</h3>
        <ol>
          {CI_STEPS[ciTab].map((step, i) => (
            <li key={step}>
              <span className="tc-ci-step-n" aria-hidden="true">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
