import { Link } from 'react-router';
import { PageHeader, usePageTitle } from '@/ui/app';

export default function NotFoundPage() {
  usePageTitle('Page not found · Microcks');
  return (
    <>
      <PageHeader title="Page not found" />
      <p>This address does not match any screen of the demo.</p>
      <p>
        <Link to="/">Back to the Cockpit</Link> or <Link to="/map">open the screen map</Link>.
      </p>
    </>
  );
}
