import { PagePlaceholder } from '@/ui/app';

/** Phase-1 placeholder. Owned by WP9 from phase 2: replace this file with the real page. */
export default function TestCreatePage() {
  return (
    <PagePlaceholder
      title="Run a test · Microcks"
      screen="08 · Run a test"
      owner="WP9"
      summary="Service, endpoint, runner, timeout, secret, operations, OAuth2, headers and a live CI snippet."
    />
  );
}
