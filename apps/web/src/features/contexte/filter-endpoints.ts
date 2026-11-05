import type { Endpoint } from '@ticket-studio/shared';

// Filtre insensible à la casse sur la méthode, le chemin et le fichier source.
export function filterEndpoints(endpoints: Endpoint[], query: string): Endpoint[] {
  const term = query.trim().toLowerCase();
  if (term === '') {
    return endpoints;
  }
  return endpoints.filter((endpoint) =>
    [endpoint.method, endpoint.path, endpoint.source].some((value) =>
      value.toLowerCase().includes(term),
    ),
  );
}
