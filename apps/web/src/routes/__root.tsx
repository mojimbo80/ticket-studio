import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { getErrorMessage } from '@/lib/get-error-message';
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
  notFoundComponent: NotFoundPage,
  errorComponent: RootError,
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

// Page introuvable : lien de retour vers le parcours.
function NotFoundPage() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Page introuvable</h1>
      <p className="text-muted-foreground">Cette adresse n’existe pas dans Ticket Studio.</p>
      <Link to="/saisie" className={buttonVariants()}>
        Revenir à la saisie
      </Link>
    </main>
  );
}

// Erreur imprévue d'une route : message clair, sans détail technique.
function RootError({ error }: { error: unknown }) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-6 py-16">
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Une erreur inattendue est survenue</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    </main>
  );
}
