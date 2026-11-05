// Toutes les clés de cache TanStack Query sont déclarées ici, par domaine.
export const queryKeys = {
  health: () => ['health'] as const,
  project: {
    context: () => ['project', 'context'] as const,
  },
};
