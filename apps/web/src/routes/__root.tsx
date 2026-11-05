import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { DevTools } from '../dev-tools';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      <DevTools />
    </>
  );
}
