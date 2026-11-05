import type { Ticket } from '@ticket-studio/shared';
import { type AgentOptions, askRepoStructured } from '../llm/agent';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';
import { buildSuggestionsPrompt, LlmSuggestionsSchema } from './llm-schema';
import { verifySuggestions, type VerifiedSuggestion } from './verify';

// Génère les suggestions de l'atelier, puis ne garde que celles que la vérification valide.
export async function buildSuggestions(
  ticket: Ticket,
  options: AgentOptions = {},
): Promise<VerifiedSuggestion[]> {
  try {
    const { data, readFiles } = await askRepoStructured(
      buildSuggestionsPrompt(ticket),
      LlmSuggestionsSchema,
      options,
    );
    return verifySuggestions(data.suggestions, readFiles);
  } catch (error) {
    logger.error({ err: error }, 'Génération des suggestions échouée');
    throw new AppError(
      502,
      'Les suggestions n’ont pas pu être générées, réessayez dans un instant.',
    );
  }
}
