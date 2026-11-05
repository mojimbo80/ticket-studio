import { queryOptions } from '@tanstack/react-query';
import type { Diagnostic } from '@ticket-studio/shared';
import { queryKeys } from './keys';

// Le diagnostic n'est jamais demandé au serveur : il est écrit dans le cache par l'analyse.
export function diagnosisQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.analysis(),
    queryFn: (): Promise<Diagnostic> => Promise.reject(new Error('Aucune analyse en cache')),
    enabled: false,
    staleTime: Infinity,
  });
}
