import { queryOptions } from '@tanstack/react-query';
import { HealthResponseSchema } from '@ticket-studio/shared';
import { apiGet } from './client';
import { queryKeys } from './query-keys';

export function healthQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.health(),
    queryFn: () => apiGet('/health', HealthResponseSchema),
  });
}
