// Toutes les clés de cache TanStack Query sont déclarées ici, par domaine.
export const queryKeys = {
  health: () => ['health'] as const,
  project: {
    context: () => ['project', 'context'] as const,
  },
  // Diagnostic issu de la dernière analyse : lu par Diagnostic et Atelier sans relancer l'analyse.
  analysis: () => ['analysis'] as const,
  // Suggestions générées pour le ticket de la session : un seul appel à l'agent par analyse.
  suggestions: () => ['suggestions'] as const,
};
