import { queryOptions } from '@tanstack/react-query';
import { HealthResponseSchema } from '@ticket-studio/shared';
import { apiFetch } from '@/api/client';
import { queryKeys } from './keys';

export function healthQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.health(),
    queryFn: () => apiFetch('/health', HealthResponseSchema),
  });
}
