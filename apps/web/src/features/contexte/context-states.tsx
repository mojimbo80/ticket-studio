import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/get-error-message';

// Affiché pendant le chargement du contexte (loader de la route).
export function ContextPending() {
  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-6 py-10">
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </main>
  );
}

interface ContextErrorProps {
  error: unknown;
  reset: () => void;
}

// Affiché si le contexte ne peut pas être chargé (API injoignable, dépôt indisponible…).
export function ContextError({ error, reset }: ContextErrorProps) {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-6 py-10">
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Contexte du projet indisponible</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>{getErrorMessage(error)}</span>
          <Button variant="outline" size="sm" onClick={reset}>
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  );
}
