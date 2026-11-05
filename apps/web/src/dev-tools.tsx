import { lazy, Suspense } from 'react';

// Les devtools ne sont importés qu'en développement : en production, leur code n'est pas inclus.
const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : null;

const QueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null;

export function DevTools() {
  if (!RouterDevtools || !QueryDevtools) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <RouterDevtools />
      <QueryDevtools />
    </Suspense>
  );
}
