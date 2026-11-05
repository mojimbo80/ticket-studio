import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { analyzeRouter } from './routes/analyze';
import { chatRouter } from './routes/chat';
import { healthRouter } from './routes/health';
import { projectRouter } from './routes/project';
import { suggestionsRouter } from './routes/suggestions';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.use(cors({ origin: env.WEB_ORIGIN }));
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', projectRouter);
  app.use('/api', analyzeRouter);
  app.use('/api', suggestionsRouter);
  app.use('/api', chatRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
