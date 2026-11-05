import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { hasTicketTitle, useTicketStore } from '@/features/saisie/ticket-store';
import { queryKeys } from '@/queries/keys';

// Garde de navigation : sans titre, on renvoie vers la saisie.
export function requireTicketTitle(): void {
  if (!hasTicketTitle(useTicketStore.getState().ticket)) {
    // TanStack Router attend un objet redirect levé, et non une Error.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/saisie' });
  }
}

// Garde de navigation : sans analyse en cache (rechargement de page), on renvoie vers l'analyse.
export function requireAnalysis(queryClient: QueryClient): void {
  if (queryClient.getQueryData(queryKeys.analysis()) === undefined) {
    // TanStack Router attend un objet redirect levé, et non une Error.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/analyse' });
  }
}
