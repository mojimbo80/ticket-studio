import { TicketSchema } from '@ticket-studio/shared';
import { Router } from 'express';
import { AnalysisCancelledError, runAnalysis } from '../analysis/run-analysis';
import { openEventStream } from '../analysis/sse';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

export const analyzeRouter = Router();

// Analyse d'un ticket en flux SSE : une progression par étape, puis le diagnostic (ou une erreur).
analyzeRouter.post('/analyze', async (req, res) => {
  const ticket = TicketSchema.parse(req.body);

  let clientGone = false;
  res.on('close', () => {
    clientGone = true;
  });

  const emit = openEventStream(res);
  try {
    await runAnalysis(ticket, emit, () => clientGone);
  } catch (error) {
    if (!(error instanceof AnalysisCancelledError)) {
      logger.error({ err: error }, 'Analyse du ticket échouée');
      emit({ type: 'error', message: publicMessage(error) });
    }
  } finally {
    res.end();
  }
});

// Message affiché au client : jamais le détail technique d'une erreur interne.
function publicMessage(error: unknown): string {
  return error instanceof AppError
    ? error.message
    : 'Analyse impossible, réessayez dans un instant.';
}
