import { isRouteErrorResponse, useRouteError } from 'react-router';
import { NotFoundError } from '@/application/shared';
import { PageHeader } from './PageHeader';
import { usePageTitle } from './usePageTitle';

/** Error element of the page area (inside the shell): a thrown use-case error ends up here. */
export function RouteErrorPage() {
  const error = useRouteError();
  usePageTitle('Something went wrong · Microcks');
  const message =
    error instanceof NotFoundError
      ? error.message
      : isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : error instanceof Error
          ? error.message
          : 'Unknown error';
  return (
    <>
      <PageHeader title="Something went wrong" />
      <div role="alert" className="callout" data-tone="danger">
        <p>{message}</p>
      </div>
    </>
  );
}
