import { ChatEventSchema, ChatRequestSchema } from '@ticket-studio/shared';
import { Router } from 'express';
import { openSseStream } from '../analysis/sse';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';
import { runChat } from '../chat/run-chat';

export const chatRouter = Router();

// Tour de conversation en flux SSE : progression des outils, puis la réponse, ou une erreur.
chatRouter.post('/chat', async (req, res) => {
  const request = ChatRequestSchema.parse(req.body);

  let clientGone = false;
  res.on('close', () => {
    clientGone = true;
  });

  const emit = openSseStream(res, ChatEventSchema);
  try {
    await runChat(request, emit, () => clientGone);
  } catch (error) {
    if (!clientGone) {
      if (!(error instanceof AppError)) {
        logger.error({ err: error }, 'Chat échoué');
      }
      emit({
        type: 'error',
        message: error instanceof AppError ? error.message : 'Réponse impossible, réessayez.',
      });
    }
  } finally {
    res.end();
  }
});
