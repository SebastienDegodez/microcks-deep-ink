export interface CssViolation {
  line: number;
  code: 'unscoped-selector' | 'global-selector' | 'layer-deep-ink' | 'token-redefined' | 'import';
  message: string;
  selector?: string;
}
export function checkPluginCss(
  cssText: string,
  tagPrefix: string,
  options?: { tokenNames?: Iterable<string> },
): { ok: boolean; violations: CssViolation[] };
export function tokenNamesFromJson(json: unknown): Set<string>;
export function loadTokenNames(file: string): Set<string>;
export function main(argv: string[]): number;
