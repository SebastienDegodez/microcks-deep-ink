import type { ImportIssue, ImportIssueCode } from './document';

/** Arazzo features outside the POC subset, with the wording shown in the "Source" tab. */
export const POC_REFUSALS: readonly { code: ImportIssueCode; label: string }[] = [
  { code: 'goto', label: 'goto actions (only retry and end are supported)' },
  { code: 'jsonpath-criteria', label: 'JSONPath success criteria' },
  { code: 'xpath-criteria', label: 'XPath success criteria' },
  { code: 'workflow-id-step', label: 'steps that call another workflow (workflowId)' },
  { code: 'operation-path-step', label: 'steps addressed by operationPath' },
  { code: 'workflow-depends-on', label: 'workflow-level dependsOn' },
  { code: 'workflow-success-actions', label: 'workflow-level successActions' },
  { code: 'workflow-failure-actions', label: 'workflow-level failureActions' },
  { code: 'components-action', label: 'actions taken from $components' },
  { code: 'cookie-parameter', label: 'cookie parameters' },
];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const LABEL = new Map(POC_REFUSALS.map((r) => [r.code, r.label]));

function issue(code: ImportIssueCode, path: string): ImportIssue {
  return { code, path, message: `Refused at import, not supported yet: ${LABEL.get(code)} (${path}).` };
}

function criterionType(c: unknown): string | undefined {
  if (!isObj(c)) return undefined;
  const t = c.type;
  if (typeof t === 'string') return t;
  if (isObj(t) && typeof t.type === 'string') return t.type;
  return undefined;
}

function checkActions(list: unknown, path: string, out: ImportIssue[]): void {
  arr(list).forEach((a, i) => {
    const here = `${path}[${i}]`;
    if (!isObj(a)) return;
    if (typeof a.reference === 'string' && a.reference.startsWith('$components')) out.push(issue('components-action', here));
    if (a.type === 'goto') out.push(issue('goto', here));
    arr(a.criteria).forEach((c, j) => checkCriterion(c, `${here}.criteria[${j}]`, out));
  });
}

function checkCriterion(c: unknown, path: string, out: ImportIssue[]): void {
  const type = criterionType(c);
  if (type === 'jsonpath') out.push(issue('jsonpath-criteria', path));
  if (type === 'xpath') out.push(issue('xpath-criteria', path));
}

/**
 * Checks a parsed Arazzo document (the raw JS object of the YAML) against the POC subset.
 * Returns one issue per refused feature occurrence, in document order; `[]` means the document
 * can be imported as is.
 *
 * Refused: goto actions, jsonpath/xpath criteria, steps by `workflowId` or `operationPath`,
 * workflow-level `dependsOn` / `successActions` / `failureActions`, actions from `$components`,
 * and cookie parameters.
 */
export function validatePocSubset(raw: unknown): ImportIssue[] {
  const out: ImportIssue[] = [];
  if (!isObj(raw)) return out;

  arr(raw.workflows).forEach((wf, wi) => {
    if (!isObj(wf)) return;
    const wp = `workflows[${wi}]`;
    if (wf.dependsOn !== undefined) out.push(issue('workflow-depends-on', `${wp}.dependsOn`));
    if (wf.successActions !== undefined) {
      out.push(issue('workflow-success-actions', `${wp}.successActions`));
      checkActions(wf.successActions, `${wp}.successActions`, out);
    }
    if (wf.failureActions !== undefined) {
      out.push(issue('workflow-failure-actions', `${wp}.failureActions`));
      checkActions(wf.failureActions, `${wp}.failureActions`, out);
    }
    arr(wf.parameters).forEach((p, pi) => {
      if (isObj(p) && p.in === 'cookie') out.push(issue('cookie-parameter', `${wp}.parameters[${pi}]`));
    });

    arr(wf.steps).forEach((st, si) => {
      if (!isObj(st)) return;
      const sp = `${wp}.steps[${si}]`;
      if (st.workflowId !== undefined) out.push(issue('workflow-id-step', `${sp}.workflowId`));
      if (st.operationPath !== undefined) out.push(issue('operation-path-step', `${sp}.operationPath`));
      arr(st.parameters).forEach((p, pi) => {
        if (isObj(p) && p.in === 'cookie') out.push(issue('cookie-parameter', `${sp}.parameters[${pi}]`));
      });
      arr(st.successCriteria).forEach((c, ci) => checkCriterion(c, `${sp}.successCriteria[${ci}]`, out));
      checkActions(st.onSuccess, `${sp}.onSuccess`, out);
      checkActions(st.onFailure, `${sp}.onFailure`, out);
    });
  });
  return out;
}
