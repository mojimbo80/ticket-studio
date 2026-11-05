import { type Diagnostic, getTicketSections, type Ticket } from '@ticket-studio/shared';
import { type AgentOptions, askRepoStructured } from '../llm/agent';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';
import { assembleDiagnosis } from './assemble';
import { buildDiagnosisPrompt, LlmDiagnosisSchema } from './llm-schema';

// Diagnostic complet : règles déterministes, propositions et termes ambigus relevés par l'agent.
export async function buildDiagnostic(
  ticket: Ticket,
  options: AgentOptions = {},
): Promise<Diagnostic> {
  const emptySections = getTicketSections(ticket).filter(
    (section) => !section.filled && section.key !== 'title',
  );

  try {
    const { data, readFiles } = await askRepoStructured(
      buildDiagnosisPrompt(ticket, emptySections),
      LlmDiagnosisSchema,
      options,
    );
    return assembleDiagnosis(ticket, data, readFiles);
  } catch (error) {
    logger.error({ err: error }, 'Diagnostic de l’agent échoué');
    throw new AppError(502, 'Le diagnostic n’a pas pu être rédigé, réessayez dans un instant.');
  }
}
