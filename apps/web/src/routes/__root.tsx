import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { AppHeader } from '@/components/layout/app-header';
import { Toaster } from '@/components/ui/sonner';
import { DevTools } from '../dev-tools';

interface RouterContext {
  queryClient: QueryClient;
}

// Libellé affiché dans le fil d'Ariane pour cette route.
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    breadcrumb?: string;
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <AppHeader />
      <Outlet />
      <Toaster />
      <DevTools />
    </div>
  );
}
