import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { ProjectContextSchema } from '@ticket-studio/shared';
import { apiFetch } from '@/api/client';
import { queryKeys } from './keys';

const PROJECT_CONTEXT_STALE_TIME_MS = 60 * 1000;

export function projectContextQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.project.context(),
    queryFn: () => apiFetch('/project/context', ProjectContextSchema),
    staleTime: PROJECT_CONTEXT_STALE_TIME_MS,
  });
}

export function reindexProjectMutationOptions() {
  return mutationOptions({
    mutationFn: () => apiFetch('/project/reindex', ProjectContextSchema, { method: 'POST' }),
  });
}
