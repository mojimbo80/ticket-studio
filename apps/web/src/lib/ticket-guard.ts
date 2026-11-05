import { redirect } from '@tanstack/react-router';
import { hasTicketTitle, useTicketStore } from '@/features/saisie/ticket-store';

// Garde de navigation : sans titre, on renvoie vers la saisie.
export function requireTicketTitle(): void {
  if (!hasTicketTitle(useTicketStore.getState().ticket)) {
    // TanStack Router attend un objet redirect levé, et non une Error.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/saisie' });
  }
}
