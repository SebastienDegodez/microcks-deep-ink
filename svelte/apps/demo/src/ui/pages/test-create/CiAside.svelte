<script lang="ts">
  import { CI_STEPS, ciDiffLegend, type CiFormat, type CiLine } from '@microcks/demo-core/domain/testing';
  import { Chip, CodeBlock, Icon } from '@microcks/deep-ink';
  import { changedLineCount, CI_TABS, codeLines } from './form';

  interface Props {
    uid: string;
    ciTab: CiFormat;
    ontabchange: (tab: CiFormat) => void;
    lines: CiLine[];
    serviceLabel: string;
    oauth: boolean;
  }

  /** "Run it from CI": the test as a CI snippet, the lines that differ from the defaults highlighted. */
  let { uid, ciTab, ontabchange, lines, serviceLabel, oauth }: Props = $props();
  const changed = $derived(changedLineCount(lines));
</script>

<aside class="tc-ci" aria-labelledby={`${uid}-ci-title`}
  ><div class="tc-ci-head"
    ><h2 id={`${uid}-ci-title`} class="tc-ci-title">Run it from CI</h2><Chip size="sm" variant="outline"
      ><Icon name="refresh-arrows" size={12} />{' synced with the form'}</Chip
    ></div
  ><p class="tc-ci-intro">The same test, as code. Once it passes here, paste it in your pipeline so every build proves the contract.</p><CodeBlock
    class="tc-ci-code"
    tabsLabel="CI format"
    tabs={CI_TABS}
    tab={ciTab}
    ontabchange={(id) => ontabchange(id as CiFormat)}
    lines={codeLines(lines)}
  /><p class="tc-ci-legend" role="status"><span class="tc-ci-swatch" aria-hidden="true"></span><span>{ciDiffLegend(changed, serviceLabel)}</span></p
  >{#if oauth}<div class="tc-callout-outline" role="note"
      ><Icon name="warning" size={14} class="tc-callout-icon" /><span
        >OAuth2 settings only apply to this run from the UI: the CLI, the GitHub Action and the Tekton task shown here do not carry them.</span
      ></div
    >{/if}<div class="tc-ci-steps"
    ><h3>Before you paste</h3><ol
      >{#each CI_STEPS[ciTab] as step, i (step)}<li><span class="tc-ci-step-n" aria-hidden="true">{i + 1}</span><span>{step}</span></li>{/each}</ol
    ></div
  ></aside
>
