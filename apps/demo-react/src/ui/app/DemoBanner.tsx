/**
 * Visible DEMO marking, in the top bar of every page: the app runs on in-memory data and never
 * saves anything. Uses the warning tint with text (not color alone).
 */
export function DemoBanner() {
  return (
    <p className="demo-banner" data-tone="warning">
      <strong className="demo-banner-tag">DEMO</strong>
      <span aria-hidden="true"> · </span>
      <span>in-memory data, nothing is saved</span>
    </p>
  );
}
