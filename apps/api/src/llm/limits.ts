// Garde-fous de l'agent : bornent le coût, la taille des réponses et la durée d'une requête.
export const LLM_LIMITS = {
  maxToolCalls: 12,
  maxResponseTokens: 2048,
  requestTimeoutMs: 60_000,
  maxRetries: 2,
  maxSearchResults: 30,
  searchContextLines: 2,
  maxFileChars: 20_000,
  maxEndpoints: 200,
  maxScreenCandidates: 300,
  maxScreenResults: 10,
} as const;
