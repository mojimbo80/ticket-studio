import { z } from 'zod';

export const SuggestionKindSchema = z.enum(['reutiliser', 'preciser', 'oubli', 'cas-limite']);

export const SuggestionImportanceSchema = z.enum(['haute', 'moyenne', 'basse']);

// Suggestion affichée au PM. Le chemin réel du fichier source reste côté serveur : seul le libellé est envoyé.
export const SuggestionSchema = z.object({
  id: z.string(),
  kind: SuggestionKindSchema,
  importance: SuggestionImportanceSchema,
  title: z.string(),
  body: z.string(),
  sourceLabel: z.string(),
  answers: z.array(z.string()).min(2).max(3),
});

export const SuggestionsResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema).max(8),
});

export type SuggestionKind = z.infer<typeof SuggestionKindSchema>;
export type SuggestionImportance = z.infer<typeof SuggestionImportanceSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type SuggestionsResponse = z.infer<typeof SuggestionsResponseSchema>;
