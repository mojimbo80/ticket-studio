import { queryOptions } from '@tanstack/react-query';
import { SuggestionsResponseSchema, type Ticket } from '@ticket-studio/shared';
import { apiFetch } from '@/api/client';
import { queryKeys } from './keys';

// Suggestions générées une seule fois pour le ticket de la session (appel coûteux à l'agent).
export function suggestionsQueryOptions(ticket: Ticket) {
  return queryOptions({
    queryKey: queryKeys.suggestions(),
    queryFn: () =>
      apiFetch('/suggestions', SuggestionsResponseSchema, { method: 'POST', body: ticket }),
    staleTime: Infinity,
  });
}
